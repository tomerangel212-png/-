cmake_minimum_required(VERSION 3.16)
project(tra_offline_verify LANGUAGES CXX)

add_executable(tra_offline_verify tra_offline_verify.cpp)
target_compile_features(tra_offline_verify PRIVATE cxx_std_17)
target_compile_options(tra_offline_verify PRIVATE -Wall -Wextra -Wpedantic)
