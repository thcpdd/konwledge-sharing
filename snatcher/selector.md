# 课程选择器模块

*它是智能抢课系统的强业务部分，就是它来帮我们完成选课。*

---

## 模块概览

这个模块的所有代码位于：`./snatcher/selector` 下。

当你打开该目录，引入你眼帘的应该是这几个 Python 文件：

1. `async_selector.py`：该文件存放了异步课程选择器的实现逻辑，也就是选课逻辑，我们暂且命名为：`异步选择器文件`。
2. `base.py`：这个文件定义了课程选择器基类，也就是一个基本的课程选择器拥有的基本属性和行为，我们暂且命名为：`课程选择器基类文件`。
3. `performers.py`：这个文件里编写了一些课程选择器执行器的基本逻辑，我们暂且命名为：`课程选择器执行器文件`。

下面我来一一介绍文件里的内容。

## 课程选择器基类文件

打开这个文件，你会看到一个名为 `BaseCourseSelector` 的类。

它是所有课程选择器的基类，这个类规定了一个标准课程选择器应有的属性和方法。

首先，这个类属于一个`异步上下文管理器`。也就是说，你可以用下面的方式来创建对象，并在对象被销毁之前将必要资源关闭：

```python
async def main():
    async with BaseCourseSelector(args, kwargs) as selector:
        pass
```

> [!warning|label:注意]
>
> 你需要在一个异步函数里创建它。

这得益于这个类实现了两个接口：

```python
async def __aenter__(self):
    """在进入上下文之前做一些事情"""
    cookie_jar = CookieJar(unsafe=True)
    timeout = ClientTimeout(total=settings.TIMEOUT)
    self.session = ClientSession(cookie_jar=cookie_jar, timeout=timeout)
    self.session_manager = get_session_manager(self.username)
    self.logger = AsyncRuntimeLogger()
    return self
    
async def __aexit__(self, exc_type, exc_val, exc_tb):
    """在退出上下文之前做一些事情"""
    await self.session.close()
    await self.logger.close()
```

### 进入上下文之前

这里创建了 3 个非常重要的属性：

- `session`：用于发送异步请求。
- `session_manager`：用于管理用户的会话信息。
- `logger`：记录选课日志。

这个 3 个属性为后续子类的选课操作奠定了非常重要的基础。

### 退出上下文之前

关闭了两个资源开销较大的资源：`session`、`logger`。这两者都会创建一个连接池，因此在选择器被垃圾回收之前需要将连接池关闭。并且这两个连接池是必须被关闭的，否则将引发代码层面的异常。

> [!tip|label:使用上下文管理器的优势]
>
> 这里用到了上下文管理一个非常重要的特性：**无论内部代码是否报错，上下文都会正常退出**。也就是说：即使内部代码发生异常，也不会影响内部资源的释放。
>
> 像这样类似的操作还有：打开文件等。

### 这个类的所有属性

下面这个类的具体所有属性信息，它包括：类属性、实例属性。

|          属性名           | 属性类别 |                             说明                             |
| :-----------------------: | :------: | :----------------------------------------------------------: |
|        course_type        |  类属性  | 课程类型，决定了课程选择器的选课类型，后续会被加到选课参数中 |
|           term            |  类属性  |               选课学期，后续会被加到选课参数中               |
|    select_course_year     |  类属性  |               选课学年，后续会被加到选课参数中               |
|         username          | 实例属性 |                           学生学号                           |
|     get_jxb_ids_data      | 实例属性 |                 获取 jxb_ids 所需的请求参数                  |
|    select_course_data     | 实例属性 |                  发送选课请求所需的请求参数                  |
|   sub_select_course_api   | 实例属性 |          选课接口的后半部分，用于拼接完整的选课接口          |
|       sub_index_url       | 实例属性 |      选课首页地址的后半部分，用于拼接完整的选课首页地址      |
|      sub_jxb_ids_api      | 实例属性 |       获取 jxb_ids 接口的后半部分，用于拼接完整的地址        |
|     select_course_api     | 实例属性 |             选课接口，值会随着主机号的变化而变化             |
|         index_url         | 实例属性 |           选课首页地址，值会随着主机号的变化而变化           |
|        jxb_ids_api        | 实例属性 |       获取 jxb_ids 的接口，值会随着主机号的变化而变化        |
|          logger           | 实例属性 |                 日志记录器，用于记录选课日志                 |
|          session          | 实例属性 |                   会话器，用于发送异步请求                   |
|      session_manager      | 实例属性 |        用户会话管理器，管理用户对每个主机号的 Cookie         |
|          cookies          | 实例属性 |                   当前主机号对应的登录信息                   |
|         base_url          | 实例属性 |                    所有请求接口的前半部分                    |
|           port            | 实例属性 |                主机号，用于拼接完整的请求接口                |
|          kch_id           | 实例属性 |                课程号 ID，用于选课的关键参数                 |
|          jxb_ids          | 实例属性 |                教学班 IDS，用于选课的关键参数                |
|          jxb_id           | 实例属性 |                教学班 ID，用于区分每个教学班                 |
|          xkkz_id          | 实例属性 |       <不知道这个参数翻译成什么好>，用于选课的关键参数       |
|          fuel_id          | 实例属性 |         燃料 ID，也就是抢课码 ID，会在选课日志中用到         |
|           index           | 实例属性 |   索引值，用于记录当前选择器的调用次数，会在选课日志中用到   |
|           jg_id           | 实例属性 |                 学院 ID，用于选课的关键参数                  |
|   extra_jxb_ids_params    | 实例属性 |       额外的 jxb_ids 参数，暂时只在体育课选择器中用到        |
|        set_kch_id         | 实例属性 |              设置课程号 ID，逻辑暂时由父类写死               |
|        set_xkkz_id        | 实例属性 |  设置 xkkz_id，方法内部要对 xkkz_id 赋值，必须返回一条消息   |
|        set_jxb_ids        | 实例属性 |  设置 jxb_ids，方法内部要对 jxb_ids 赋值，必须返回一条消息   |
|       select_course       | 实例属性 |     发送选课请求，方法内部实现选课逻辑，必须返回一条消息     |
|          _select          | 实例属性 | 会依次调用 set_kch_id、set_xkkz_id、set_jxb_ids、select_course |
| _construct_jxb_ids_params | 实例属性 | 构造获取 jxb_ids 所需参数，方法内部会对 jxb_ids 参数进行修改 |
|       _set_jxb_ids        | 实例属性 | 设置 jxb_ids，会被 set_jxb_ids 方法调用，由具体的课程选择器实现 |
|          select           | 实例属性 |     实现完整的选课逻辑，同时也是外部调用者应该调用的方法     |
|       update_cookie       | 实例属性 |             更新登录信息，随着主机号的变化而变化             |
|   update_selector_info    | 实例属性 |  更新课程选择器相关信息，主要是更新课程信息和日志记录器信息  |

通过上述表格可以看到一个标准的课程选择器包含了 30 多个属性，所以课程选择器的创建开销是非常大。因此我们应该避免频繁的创建和销毁课程选择器。

我们可以通过调用 `update_selector_info` 方法来不断更新选择器信息，从而到达到可以选择**同一类别不同课程**的目的。

> [!warning|label:注意]
>
> 同一类别不同课程指的是：体育课不同课程或公选课不同课程。

一个简单的调用例子：

```python
async def main():
    async with selector_class(args, kwargs) as selector:
        for course_info in courses:
            await selector.update_selector_info(course_info)
            code, message = await selector.select()
            if code == 1:
                print('选课成功')
                break
```

这就是调用一个课程选择器的标准方法，它可以做到选择多个课程的同时让大量的资源得到复用。

### 需要留意的几个方法

- `set_kch_id`
- `set_xkkz_id`
- `set_jxb_ids`
- `select`

这几个方法都是选课中的关键方法，前面 3 个方法是给最后一个方法做铺垫，也就是构造请求参数。最后一个方法是发送选课请求。

因此如果你想自己实现一个课程选择器，那么这 4 个方法应该是一个标准的模板方法。例如：

```python
class CustomCourseSelector:
    def __init__(self):
        self.kch_id = None
        self.xkkz_id = None
        self.jxb_ids = None
        
    def set_kch_id(self):
        ...
        self.kch_id = '真实值'
    
	def set_xkkz_id(self):
        ...
        self.xkkz_id = '真实值'
    
    def set_jxb_ids(self):
        ...
        self.jxb_ids = '真实值'
    
    def select(self):
        """发送选课请求"""
```

## 异步选择器文件

打开这个文件，你将会看到 3 个非常重要的类：

1. `AsyncCourseSelector`

   异步课程选择器，它是 `BaseCourseSelector` 类的一个派生类。它实现了异步选择器的公用方法，比如 `select`、`set_jxb_ids`等，这些方法的逻辑都是一成不变的，因此为了提高代码复用性，这里统一写在同一个父类中。

2. `AsyncPCSelector`

   异步公选课课程选择器，专门实现公选课选课逻辑。

3. `AsyncPESelector`

   异步体育课课程选择器，专门实现体育课选课逻辑。

因此在这么多的选择器中，外部调用者应该调用的是后两个选择器，因为只有它们才实现了完整的选课逻辑，它们的父类或祖先类都是为了让子类能更好的实现相应的逻辑而作出的抽象和封装。

### 手动调用课程选择器

如果你想手动调用它们，你可以这样做：

```python
import asyncio
from snatcher.selector import AsyncPCSelector

async def main():
    async with AsyncPCSelector(args, kwargs) as selector:
        await selector.update_selector_info(args, kwargs)
        await selector.select()
        
asyncio.run(main())
```

手动调用选择器可能是一个较为复杂的操作。因此系统内部定义了课程选择器执行器，我们可以将课程选择器交给执行器来调用。让我们接着往下看。

## 课程选择器执行器文件

打开这个文件，里面编写了一个异步函数和一个简单课程选择器执行器：

1. `async_selector_performer`

   异步选择器执行器，它是智能抢课系统专门的选择器执行器。它除了能自动调用课程选择器外，还包含了一系列的数据库操作、邮件发送操作等等。

   因此普通调用者请不要以它作为你的课程选择器执行器。

2. `SimpleSelectorPerformer`

   简单选择器执行器，我们可以把它看作是一个“迷你智能抢课系统”，它除了能帮你调用选择器外，还能在调用期间不断输出选课日志，并且你只需要像你平常编写 Python 代码那样调用它就行了。 

   下面是一个简单的例子：

   ```python
   from snatcher.selector import SimpleSelectorPerformer, AsyncPESelector
   
   goals = [
       ('足球俱乐部1', '1BB2143990AF721DE0630284030A2394', '1B4A6FAFDEC4AEF0E0630284030AD355'),
       ('散打俱乐部', '1C661CABC37FA592E0630284030A735A', '1B398450EB7C2B44E0630284030A0D78')
   ]
   username = '你的学号'
   password = '你的密码'
   
   performer = SimpleSelectorPerformer(username, password, AsyncPESelector, goals)
   performer.perform()
   ```

   从上述代码可以看出，你只需要将选课必要的参数扔给它就行了。即使课程选择器是异步的，但你仍然可以理所当然的以同步的方式运行，因为它内部会自动处理这个问题。

   > [!warning|label:注意]
   >
   > 请你要确保运行该代码的主机已经安装好 Redis 环境，否则上述代码将引发异常。


除了我在这里介绍的内容外，选择器还有诸多的实现细节，这里就不一一介绍了。这些细节可以通过阅读源码来进行学习。
