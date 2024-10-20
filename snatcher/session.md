# 会话管理模块

*会话模块也是缓存的一部分，在这个模块中定义了一系列用于操作用户登录信息的工具。*

---

整个模块位于：`/snatcher/session.py` 下。

下面是每个函数或类的解释：

- `SessionManager`

  会话管理器，管理一个学号对应的所有会话信息。同时它还额外管理每个年级的 `xkkz_id`。

  这个类也使用了 `代理模式` 来实现，内部的所有操作实际上是对 `Redis` 的操作。

  下面是对这个类的方法的解释：

  1. `get`

     获取一个指定主机号的 `Cookie`，返回一个字符串。

  2. `save_cookie`

     保存指定主机号的 `Cookie`。

  3. `save_xkkz_id`

     保存该学号对应年级对应课程类型的 `xkkz_id`。

  4. `get_xkkz_id`

     获取该学号对应年级对应课程类型的 `xkkz_id`。

  5. `all_sessions`

     获取该学号的所有 `Cookie`。

  6. `has_sessions`

     判断该学号是否存在 `Cookie`。

  7. `has_session`

     判断该学号是否有指定主机号对应的 `Cookie`。

  8. `get_random_session`

     从该学号中的所有会话中获取一个随机的会话。

  9. `close`

     关闭 `Redis` 连接（不是连接池）。

  但是你不应该直接创建这个管理器类，让我们接着往下看。

- `get_session_manager`

  以 LRU 缓存的形式获取一个学号对应的会话管理器。

  你应该使用这个函数来获取一个学号对应的会话管理器，因为这个函数被一个 `lru_cache` 的装饰器装饰。

  由于创建一个会话管理器对象就相当于创建了一个 `Redis` 连接池。而在课程选择器内部也会创建这个管理器类。

  所以为了提高资源的利用率，我不希望每次要获取一个学号对应的会话信息时都创建一个连接池，因此我使用一个带有缓存特性的函数来代理创建这个管理器类。

  这样就可以提高资源的利用率了。

  > [!tip|label:lru_cache装饰器]
  >
  > 这个装饰器会让这个函数变得有缓存特性。
  >
  > 换句话说，如果你第一次传给这个函数的参数是 1，那么函数会执行完内部的所有逻辑，此时如果函数有返回值，那么这个装饰器会将这个返回值保存在内存中；下次你再传入 1 调用这个函数的时候，这个装饰器会在内存中直接将上次的返回值返回，从而提高函数的执行速度。
  >
  > 不要小看这个装饰器，这在很多情况下都是非常有用的！例如实现**斐波那契数列**算法……

- `AsyncSessionSetter`

  异步会话设置器，模拟用户登录并获取登录后的 Cookie。

  它是一个异步上下文管理器，所以你创建它的对象也需要像这样：

  ```python
  async def main():
      async with AsyncSessionSetter(username, password) as setter:
          # 你的逻辑
          ...
  ```

- `async_set_session`

  设置会话（模拟登录）。

  由于创建 `AsyncSessionSetter` 对象是一个较为复杂的操作，因此我还是将这些逻辑同一写在一个函数中，因此当你需要获取某个账号的时候，你只需要调用这个函数就可以了。

  但是这不是一个普通的函数，它是一个协程函数，你需要像这样调用它：

  ```python
  import asyncio
  from snatcher.session import async_set_session
  
  asyncio.run(async_set_session(username, password))
  ```

- `async_check_and_set_session`

  检查并设置会话。

  它是 `async_set_session`  函数的二次封装，多了一个检查功能：当缓存中没有当前学号的有效 Cookie 时，那么它会尝试模拟登录并保存 Cookie；如果缓存中有当前学号的 Cookie，那么就直接返回。

  **登录成功的时候会返回 1，否则返回 -1。**

  它也是一个协程函数，因此你应该以一个协程的方式调用它，就像这样：

  ```python
  import asyncio
  from snatcher.session import async_check_and_set_session
  
  coroutine = async_check_and_set_session(username, password)
  res = asyncio.run(coroutine)
  if res == -1:
      print('登录失败')
  ```

以上就是整个会话模块的函数和类了，但最终你应该调用的函数只有两个：

1. `get_session_manager`
2. `async_check_and_set_session`

仅仅通过这两个函数你就可以很方便的操作用户的会话信息了。
