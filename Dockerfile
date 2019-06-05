FROM wrenchproject/wrench-build:ubuntu-bionic-gcc7

#################################################
# INSTALL WRENCH
#################################################

USER root
WORKDIR /tmp

# clone WRENCH, checkout version 1.5dev, build, and install
RUN git clone https://github.com/wrench-project/wrench \
    && cd wrench \
    && git checkout eb17d9fd\
    && cmake . \
    && make \
    && sudo make install

# remove installation folder
RUN rm -rf wrench

#################################################
# WRENCH's user
#################################################

USER wrench
WORKDIR /home/wrench

# set user's environment variable
ENV CXX="g++-7" CC="gcc-7"
ENV LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/usr/local/lib
