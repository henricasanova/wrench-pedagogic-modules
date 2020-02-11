
#### Learning objectives:

- Understand the concept of IO
- Understand the impact of IO operations on computing
- Understand the basics of optimizing computation around IO operations

---

### Basic Concepts

In computing, the processor typically does not run program start to finish in a vacuum. Programs often 
need to consume **I**nput and produce **O**utput, referred to as **IO operations**. A couple of very common IO operations are reading from 
disk and writing to disk. As the disk is much slower than the CPU, even small disk reads or writes can represent a large (from the CPU's perspective) chunk of time during which the CPU is sitting idle. 

When it comes to IO operations, not all programs are created equal. Some programs will require more IO time than others. In fact, programs are typically categorized as IO- or CPU-intensive. If a program spends more time performing IO operations than CPU operations, it is said to be *IO-intensive*. If the situation is reversed, the program is said to be *CPU-intensive*. For instance, a program that reads a large jpg image from disk, reduces the brightness of every pixel  (to make the image darker), and writes the modified image to disk is IO-intensive on most standard computers (a lot of data to read/write from/to disk, and very quick computation on this data - in this case perhaps just a simple subtraction). By contrast, a program that instead of reducing the brightness of the image applies an oil painting filter to it will
most likely be CPU-intensive (applying an oil painting filter entails many, many more computations than a simple subtraction). 

As mentioned above, reading from and writing to the disk are slow operations compared to the CPU. Typically, there is a difference between read and write speeds as well. Reading is 
typically significantly faster than writing. Furthermore, different kinds of disks have different speeds as well. The table below shows advertised
read and write speeds for two mass-market SATA disks, a Hard Disk Drive (HDD) and a Solid  State Drive (SSD): 


| Disk            | Read bandwidth | Write bandwidth |
|-----------------|----------------|-----------------|
| WD HDD (10EZEX) | 160 MB/sec     | 143 MB/sec      |
| Samsung 860 EVO | 550 MB/sec     | 520 MB/sec      |


The read and write speeds are often referred to as *bandwidths*. The units above is MB/sec (MegaByte  per second), which is also written as MBps. 

Determining the exact bandwidth that disk reads and writes will experience during program execution is actually difficult (due to the complexity of the underlying hardware and software, and due to how the data is stored and accessed on the disk).  In this module we will always that disk bandwidths are constant.

### A program with computation and IO

Let us consider a program that performs a task in three phases. First, it reads data from disk. Second, it performs some computation on that data to create new data. And third, it writes the new data back to disk.  This
could be one of the image processing programs mentioned in the previous section as examples.  If this program is invoked to process 2 images, i.e., so that it performs 2 tasks, then its execution timeline is as depicted below:

<object class="figure" type="image/svg+xml" data="{{ site.baseurl }}/public/img/io_effects/IO_figure_1.svg">Figure 1: Example execution timeline</object>

As can be seen in the figure, at any given time either the CPU is idle (while IO operations are ongoing) or the disk is idle (while computation is ongoing). In the above figure, reading an image from disk takes 1 second, writing an image to disk takes 1 second, and processing an image takes 2 seconds. (We can thus infer that the two images have the same size, and that the disk has identical read and write bandwidths).  We can compute the CPU Utilization as follows:

$$
\begin{align}

  \text{CPU Utilization} & = \frac{T_{Compute}}{T_{Compute} + T_{Idle}} \\
                         & = \frac{4}{4 + 4} \\
                         & = 0.5

\end{align}
$$

This means that the CPU is idle for half of the execution of the program. This program is perfectly balanced, i.e., it is neither CPU-intensive nor IO-intensive. 

### Overlapping computation and IO

The execution in the previous section can be improved. This is because the CPU and the disk are two different pieces of hardware, and they can work at the same time. As a result, while the CPU is processing the 1st image, the 2nd image could be read from disk! The CPU can then start processing the 2nd image right away after it finishes processing the 1st image. The 1st image can be written to disk at the same time. This execution is depicted below:


<object class="figure" type="image/svg+xml" data="{{ site.baseurl }}/public/img/io_effects/IO_figure_2.svg">Figure 2: Example execution timeline with overlap of IO and computation</object>

The total execution time has dropped by 2 seconds **and** the CPU utilization is increased:

$$
\begin{align}

  \text{CPU Utilization} & = \frac{T_{Compute}}{T_{Compute} + T_{Idle}} \\
                         & = \frac{4}{4 + 2} \\
                         & = 0.66
                         
\end{align}
$$

If there were additional, similar images to process, the CPU utilization would continue to drop as it would be idle only at the very beginning and at the very end of the execution. 

The above is an ideal situation because IO time for an image is exactly equal to compute time. More precisely, save for the firt and last task, *while the program computes task i there is enough  time to write the output of task i-1 and to read the input of  task i+1.*  

If the above condition does not hold, then there is necessarily CPU idle time. For instance, if the time to read an image is instead 2s (for instance because the program reads bigger images but writes back down-scaled images) and the program must process 3 images, then the execution would be as:

<object class="figure" type="image/svg+xml" data="{{ site.baseurl }}/public/img/io_effects/IO_figure_3.svg">Figure 3: Example execution timeline with overlap of IO and computation</object>

As expected, the program first reads 2 images, and then alternates write and read operations while CPU computation is going on.  But in this case, the CPU experiences idle time because images cannot be read from disk fast enough.  So although overlapping IO and computation almost always reduces program execution time, the benefit can vary based on IO and computation volumes (and especially if these volumes vary from task to task!). 



<!--#### CPU-intensive vs. IO-intensive executions

Let us return to the first example execution above: 

<object class="figure" type="image/svg+xml" data="{{ site.baseurl }}/public/img/io_effects/IO_figure_1.svg">Execution timeline</object>


In this case, we can string together as many tasks as we want and the CPU will be utilized continuously apart from
the initial read and the final write. With two tasks the IO time is a significant portion of the execution time,
but if we were to have, say, 1000 tasks to complete, that initial read and last write are a negligible portion of the
overall execution time. So, *even though the program technically spends twice as much time doing IO than computing*, because of overlap of the operation the program

 This is what we can refer to as *CPU Driven* execution time and will occur when read and write 
times are sufficiently short for tasks compared with CPU computation time needed. 

As you may guess, the other side of the coin is *IO Driven* execution times where a task's time spent on IO is longer than the 
CPU time needed. In these cases, CPU utilization will be lower due to the need to wait on IO operations to complete. -->


### Putting it all this in practice

In practice, one can implement a program that overlaps IO and computation. This can be done by using non-blocking IO operations and/or threads. These are techniques that are often taught in Operating Systems courses. The overlap may not be completely "free", as reading/writing data from disk can still requires the CPU to perform some computation. Therefore, there can be time-sharing of the CPU between the IO operations and the computation, and the computation  is slowed down a little bit by the IO operations (something we did not show in the figures above). This said, there are ways for IO operations use almost no CPU cycles. One such technique, which relies on specific but commonplace hardware, is called Direct Memory Access (DMA). See an Operating Systems course for more details.

Another practical concern is RAM pressure. When going from the example execution in Figure 1 to that in Figure 2, the peak amount of RAM needed by the program is increased because at some point more than one input images are held in RAM. As previous modules have touched on, tasks can have significant memory
requirements, and it may not be possible to overlap IO and computation due to RAM space constraints.  

### Simulating IO

So that you can gain hands-on experience with the above concepts, use the simulation Web application
(see <a href="{{site.baseurl}}/pedagogic_modules/simulation_instructions/index/" target="_blank">instructions</a>), selecting `IO Operations` from its menu.


Initially, you can create a series of identical tasks that have a certain input and output. Run the simulation to see
the progression of tasks and host utilization without allowing IO to overlap with computation. Once you have observed
this, try selecting the checkbox to allow overlap.

With IO overlap there should be an improvement in execution time and host utilization. You can view this in the output
graphs that are generated. You can also try varying the input/output and computation amounts to create IO intensive or CPU
intensive tasks. Understanding which tasks will benefit from increased R/W or computation speeds will assist you in answering the questions to come.


### Practice Questions

**[A.p4.1]** A program reads 2GB of input from disk, performs a 6 TFlop computation on this input, and then writes 1GB  of output to disk. It is executed on a computer that has a CPU that computes at speed 500 GFlop/sec
and has a HDD with R/W bandwidth of 200 MB/sec. Is the program execution IO-intensive or CPU-intensive? If you could update either  the CPU or the HDD, which upgrade would you choose?

<div class="ui accordion fluid">
  <div class="title">
    <i class="dropdown icon"></i>
    (click to see answer)
  </div>
  <div markdown="1" class="ui segment content">

The execution time breakdown is as follows:

  - Read input: 2000 MB / 200 MB/sec = 10 sec
  - Compute: 6000 GFlop / 500 GFlop/sec = 12 sec
  - Write input: 1000 MB / 200 MB/sec = 5 sec

Therefore the program's execution is IO-intensive. Therefore one should upgrade the HDD. 

  </div>
</div>



**[A.p4.2]** You are working at a company that runs instances of the same task repeatedly. On the currently available hardware, the time to process a task instance is as follows:

  - Read input: 2 Seconds  
  - CPU computation: 3 Seconds  
  - Write output: 2 Seconds  

A program was designed to overlap IO and computation when executing
multiple task instances in sequence. As in Figure 3, the program first
reads the input for the first 2 tasks, and then alternates between writing
the output for task *i* and reading the input for task *i+2*, until at the
end it writes the output of the last two tasks one after the other.  The
computation on the CPU for a task is started as soon as its input has been
read from disk.


What is the CPU utilization when processing 4 consecutive task instances?

<div class="ui accordion fluid">
  <div class="title">
    <i class="dropdown icon"></i>
    (click to see answer)
  </div>
  <div markdown="1" class="ui segment content">

Here is a depiction of the execution:

<object class="figure" type="image/svg+xml" data="{{ site.baseurl }}/public/img/io_effects/IO_figure_4.svg">Execution timeline</object>

The execution time is **18 seconds**.  (This result can be generalized for *n*
tasks by identifying the repeating pattern: *2 + 3 + (n-1) x (3 + 1) + 1  = 4n + 2*.)

The CPU is utilized for 12 seconds. Therefore the CPU utilization is 12/18
= 66.6%.

</div>
</div>


**[A.p4.3]** In the same setting as in the previous question, it is decided
to purchase a SSD to replace the HDD currently being used. The SSD has
**twice the bandwidth** of the HDD.  What is now the CPU utilization when
processing 4 consecutive task instances?



<div class="ui accordion fluid">
  <div class="title">
    <i class="dropdown icon"></i>
    (click to see answer)
  </div>
  <div markdown="1" class="ui segment content">

Here is a depiction of the execution:

<object class="figure" type="image/svg+xml" data="{{ site.baseurl }}/public/img/io_effects/IO_figure_5.svg">Execution timeline</object>

The execution time it **14 seconds**. (This result can be generalized for *n*  
    tasks easily: *3n + 2*.)

The CPU is utilized for 12 seconds. Therefore the CPU utilization is 12/14 = 85.7%. 

By making the IO faster, input for tasks is always ready for the CPU to process. 

</div>
</div>
 

### Questions

**[A.q4.1]**

Consider a series of 10 identical tasks. With the hardware we have
available, each task requires 1 second to read data from disk, 2 seconds for
computation, and 0.5 seconds to write the output back to the disk.

What is the lowest possible execution time if we are not able to perform IO during
computation? 

What is the lowest possible execution time when overlap of computation and IO is
possible?


**[A.q4.2]**

A task requires 50 MB of input data to be loaded from disk before
computation and writes 50 MB of data to disk once computation has been
completed. The computation performs 500 GFlop.  Instances of this task are
executed continuously in sequence throughout the day, in a way that
*overlaps IO and computation*.  The computer on which this is done has a
disk with R/W bandwidth 200 MB/sec and a CPU with compute speed 1.5
TFlop/sec.  We wish to increase the number of task instances we can execute
per day. Should we upgrade the processor? Or should we upgrade the disk?


**[A.q4.3]**

A task requires 100 MB of input data to be loaded from disk, performs 1
TFlop of computation, and writes some output back to disk. A batch of fifty
instances of this task is to be run on a computer with a processor capable
of 250 GFlop/sec and a disk with R/W bandwidths of 100 MB/sec. IO and
computation are overlapped.*

How large can the task output be so that the CPU is 100\% utilized
(ignoring the initial input read and final output write, during which the
CPU is necessarily idle).



