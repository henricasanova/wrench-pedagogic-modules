cmake -DCMAKE_CXX_FLAGS="-DDEBUG" . && make clean && make && mv ./activity_multi_core_simulator ./activity_multi_core_simulator_debug \
    && cmake -DCMAKE_CXX_FLAGS="-UDEBUG" . && make clean && make
