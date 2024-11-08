# 任务调度模块

*整个系统实现并发选课就靠它来调度。*

---

## 如何实现并发？

在介绍这个模块之前，我们需要讨论一下这个问题。

事实上，实现并发的方式有很多，常见的方式包括：

1. **多进程**

   每次运行一个函数的时候，都会创建一个进程来调用它，例如在 Python 中实现多进程：

   ```python
   from multiprocessing import Process
   
   def calculate():
       num = 0
       for _ in range(100):
           num += 1
       print(num)
   
   # 多进程需要在一个主进程中创建并运行
   if __name__ == '__main__':    
       for _ in range(5):
           process = Process(target=calculate)
           process.start()
           process.join()
   ```

   但是，多进程更适合 CPU 密集型任务，例如处理大量的数学计算。但是选课属于 IO 密集型，因此使用多进程在这种情况下发挥的作用不大。

   > [!note|label:GIL 限制]
   >
   > GIL，全局解释器锁。
   >
   > 由于 Python 早期设计的原因，同一时刻下不能有多个线程操作同一个字节码，所以即便上述代码是一个多进程模型，但它仍然不能发挥现代多核 CPU 的优势而实现真正的多进程。

2. **多线程**

   以下是一个用 Python 实现多线程的例子：

   ```python
   import time
   from threading import Thread
   
   def func(num):
       print(num)
       time.sleep(1)
   
   for i in range(5):
       thread = Thread(target=func, args=(i,))
       thread.start()
   ```

   上述代码创建了 5 个线程来执行同一个函数，由于每个线程的运行是同时进行的，因此上述代码执行所花费的时间会在 1 秒左右。

   但是，在 Python 中不是有 GIL 的限制嘛？为什么上述代码还是能在 1 秒钟左右就执行完毕了呢？

   因为在处理 IO 操作的时候，当前线程会释放调当前锁，此时其他线程就能够获取这把锁，从而达到多线程的目的。

   即使这样看起来像多线程，但它仍然不是真正意义上的多线程。因为在 Python 解释器中仍然有一把锁限制了线程的操作。

   由于选课是 IO 密集型任务，因此使用多线程来实现并发是最为合适的。但是，一旦当选课任务多起来，比如有 100 多个选课任务，那么我是不是应该也创建 100 多个线程呢？

   其实线程不是越多越好，创建过多的线程还会导致任务执行效率低下。因为多个线程之间需要不断地切换上下文，而切换上下文的过程是较为耗时的，所以多线程的创建也是一个难题。

3. **协程**

   协程是一种轻量级线程。下面是协程和线程间的区别：

   - **线程处在操作系统中的内核态，而协程则处在用户态。**
   - **线程必须由操作系统调度，而协程完全由用户调度。**
   - **线程上下文间的切换较慢，而协程上下文间的切换较快。**
   
   也就是说，协程是比线程更小的执行单位，而且一个协程就能实现并发，这是协程非常重要的特性。

   有关协程的工作原理可以自行在网上查阅相关资料，这里就详细展开说明了……

   而由于智能抢课系统本身就是基于协程开发的，因此最终我决定以协程的方式实现并发。

## 并发框架的选择

我们可以将多个选课任务放到一个队列中，此时放入队列的人我们称它为**生产者**，既然有生产者，那么理应由**消费者**来消费这个任务。

因此并发模型我们可以选择**生产者-消费者**模式，那么这个队列我们称为**消息队列**。

在 Python 中，有许多优秀的消息队列框架：

1. **Celery**

   在 Python 中使用最广泛的、社区最大的消息队列管理系统。

   但是，它并不适合这个项目，因为它不支持执行异步函数，所以我果断放弃了它。

2. **Dramatiq**

   与前者类似，而且它支持执行异步函数。但由于它实现多任务的方式是多线程，因此我放弃了它。

3. **Taskiq**

   这个框架实现多任务的方式完全基于 Python 原生协程，按理说它是最适合本项目的。

   但是，由于它使用起来较为复杂，并且不支持一些我想要的功能，所以我还是没有选择它。

4. ……

选择消息队列框架的过程是一个漫长且头疼的过程，并且在很多常见消息队列框架中都不支持协程函数。

但我还是在 GitHub 这个强大的开源社区中找到了我意向中的框架：[https://github.com/python-arq/arq](https://github.com/python-arq/arq)

这个框架完全基于 Redis 来实现消息队列，并且它完全使用 Python 协程来实现并发，还支持定时任务、延时任务、任务重试等消息队列基本功能，并且它是一个轻量级框架。

> [!note|label:延时任务队列]
>
> 这个框架是基于 Redis 的有序集合（zset）实现的延时任务队列。
>
> 即以时间戳作为集合的权重，循环判断时间戳是否到达预定时间，若是达到了预定时间，那么就执行任务。

上面提到的特性完全适合本项目，因此我最终决定使用这个框架来作为本项目的消息队列框架。我十分期待它在生产环境中的表现。

## 模块说明

这个模块位于：`/snatcher/aiotasks.py`下。

这个模块下有 4 个函数或类：

1. `select_course_task`

   选课任务，它是一个 Arq 任务，会被延时执行。

   它根据传入的任务类型获取对应的课程选择器，再将参数传给选择器执行器，再有由执行器来执行选课逻辑。

2. `select_course`

   它也是一个 Arq 任务，但他不是选课任务，它是选课任务的生产者，由后端调用。

   它在执行时就将当前学号提前模拟登录并保存登录信息，最后发送一个延时选课任务。

3. `query_selected_number_task`

   一个定时任务，专门用于轮询查询指定课程类型课程的已选择人数，并保存到缓存中。后端再读取缓存中的数据，返回给前端。

4. `WorkerSettings`

   Arq 框架的配置类，启动 Arq 时会读取这个类里的配置信息。

最后，你可以通过下面这句话来启动任务队列：

```bash
arq snatcher.aiotasks.WorkerSettings
```