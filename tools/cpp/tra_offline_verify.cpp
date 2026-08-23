// Independent integrity verifier for TRA's generated offline bundle.
// It intentionally uses FNV-1a only to catch accidental file drift; it is not
// a cryptographic signature or a replacement for GitHub's trust model.

#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

namespace fs = std::filesystem;

struct Entry {
  std::string path;
  std::uintmax_t bytes{};
  std::string hash;
};

std::string fnv1a64(const fs::path& file) {
  constexpr std::uint64_t offset = 0xcbf29ce484222325ULL;
  constexpr std::uint64_t prime = 0x100000001b3ULL;
  std::ifstream input(file, std::ios::binary);
  std::uint64_t value = offset;
  char byte = 0;
  while (input.get(byte)) {
    value ^= static_cast<unsigned char>(byte);
    value *= prime;
  }
  std::ostringstream result;
  result << std::hex << std::nouppercase << std::setw(16) << std::setfill('0') << value;
  return result.str();
}

bool safe_relative_path(const std::string& raw) {
  const fs::path path(raw);
  if (path.empty() || path.is_absolute()) return false;
  for (const auto& part : path) {
    if (part == "..") return false;
  }
  return true;
}

bool parse_entry(const std::string& line, Entry& entry) {
  std::istringstream fields(line);
  std::string bytes;
  if (!std::getline(fields, entry.path, '\t') || !std::getline(fields, bytes, '\t') || !std::getline(fields, entry.hash)) {
    return false;
  }
  try {
    std::size_t used = 0;
    entry.bytes = std::stoull(bytes, &used);
    return used == bytes.size() && safe_relative_path(entry.path) && entry.hash.size() == 16;
  } catch (...) {
    return false;
  }
}

int main(int argc, char** argv) {
  const fs::path manifest = argc > 1 ? argv[1] : "offline-manifest.tsv";
  const fs::path root = argc > 2 ? argv[2] : ".";
  std::ifstream input(manifest);
  if (!input) {
    std::cerr << "Cannot open offline manifest: " << manifest << '\n';
    return 2;
  }
  std::size_t checked = 0;
  std::size_t failures = 0;
  std::string line;
  while (std::getline(input, line)) {
    if (line.empty() || line.front() == '#') continue;
    Entry entry;
    if (!parse_entry(line, entry)) {
      std::cerr << "Malformed manifest row: " << line << '\n';
      ++failures;
      continue;
    }
    const fs::path candidate = root / fs::path(entry.path);
    std::error_code error;
    if (!fs::is_regular_file(candidate, error)) {
      std::cerr << "Missing cached file: " << entry.path << '\n';
      ++failures;
      continue;
    }
    const auto size = fs::file_size(candidate, error);
    if (error || size != entry.bytes) {
      std::cerr << "Size mismatch: " << entry.path << " (expected " << entry.bytes << ", got " << size << ")\n";
      ++failures;
      continue;
    }
    const auto actual_hash = fnv1a64(candidate);
    if (actual_hash != entry.hash) {
      std::cerr << "Content mismatch: " << entry.path << '\n';
      ++failures;
      continue;
    }
    ++checked;
  }
  if (failures != 0) {
    std::cerr << "TRA offline verifier FAILED: " << failures << " issue(s), " << checked << " file(s) verified.\n";
    return 1;
  }
  std::cout << "TRA offline verifier PASSED: " << checked << " cached file(s) verified.\n";
  return 0;
}
