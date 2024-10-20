# 用专业技能解放你的双手

*本文使用的编程语言是 `Python`。但只要你能够理解其中的本质，对于  `C++` 、 `Java` 、 `Golang` 等编程语言也是可以很轻易的实现的。*

---

## 快速开始

首先，如果你想要用代码来抢课的话，你得有一门你能够拿的出手的编程语言。

此外，你还要清楚的知道 `爬虫` 的本质是什么，以及它的类别分别对应了什么作用。

话不多说，先上代码：

```python
import requests

# 参数的值请以实际情况为主
cookie = 'JSESSIONID=9EC32E9938B09BCF79BA2155B09539FB'
xkkz_id = '1BC15DE0880E963BE0630284030AA7B1'
kch_id = '1000Y31Y053'

data = {
    'bklx_id': 0,
    'njdm_id': '2022',
    'xkxnm': '2024',  # 2024 学年
    'xkxqm': '3',  # 上学期
    'kklxdm': '10',  # 公选课课程类型
    'kch_id': kch_id,
    'xkkz_id': xkkz_id,
}
url = 'http://10.3.132.5/jwglxt/xsxk/zzxkyzbjk_cxJxbWithKchZzxkYzb.html?gnmkdm=N253512'
headers = {'Cookie': cookie}
response = requests.post(url, data=data, headers=headers)
do_jxb_id = response.json()[0]['do_jxb_id']
"""
do_jxb_id:  0a3d6fcbafa0347972ab7bcd3fa5b9c709a65c63ca6e3cb4b0bd86d15fc93ee9ac3976b7d77e7961256a4104dfc56f1a2dfe5cfc5a04bb8ca9ea738725f5f6eaaa2fb3812811fad2e25bd4908486e354f4c99355bf88b11270014012970e1495086745fc5eef191c61a78aaf4daa4238cad1fe2838d2514b9b6656b17dce7617
"""

api = 'http://10.3.132.5/jwglxt/xsxk/zzxkyzbjk_xkBcZyZzxkYzb.html?gnmkdm=N253512'
d = {'jxb_ids': do_jxb_id, 'kch_id': kch_id, 'qz': 0}
response = requests.post(api, data=d, headers=headers)
print(response.text)
# {'flag':'1'}  选课成功

```

如果你对 `Python` 非常了解，那么你一定知道其中的含义是什么。

虽然上面总代码量只有 20 行左右，但我可以很明确的告诉你，这仅仅 20 行代码就能够实现公选课选课。

在这 20 多行代码中，你只需要关注最前面的 3 个变量：`cookie`、`xkkz_id`、`kch_id` 就可以了。

- **cookie**

  用于携带登录信息，登录教务系统后刷新就可以获取。

- **xkkz_id**

  它可能决定了选课的时间、选课的类型、开课的年级等等。在选课首页的源代码中可以获取。

- **kch_id**

  课程号 ID，在课程列表中可以找到。

> [!tip]
>
> 用代码抢课的好处包括但不限于以下几点：
>
> 1. **不用自己手动选课**
>
>    你只需要提前准备好那些参数，等到选课开始直接运行代码就行了，免去了在浏览器上面一系列繁琐的操作。
>
> 2. **降低服务器压力**
>
>    至始至终都只向一个网址发起请求。不会像手动选课那样可能需要多开窗口。
>
> 3. **加快选课速度**
>
>    如果是在浏览器上面选课，浏览器会发送一些很多不必要的请求。通过代码选课，可以免去这些不必要的请求。并且在某种程度上也可以减小服务器的压力。
>
>    *这里的 `加快` 指的是相对于手动选课而言的，选课的速度还得取决于教务系统的服务器。*

## 上述代码的不足

1. **需要手动获取参数**

   这一点应该是我觉得最不理想的地方，其实我想要达到的目的是：输入账号密码、选择相应的课程之后就可以帮我完成选课。但是上述代码却没有达成我的目的。

2. **不支持多人选课**

   尽管你觉得手动获取参数不算什么，但如果你想实现帮多个人选课，那这部分代码是有点困难的。

   > [!tip]
   >
   > 当然，你也可以同时运行多个这样的文件，这也是一种解决方案。

3. **没有处理异常情况**

   你是否决定上述代码就已经很完美了？

   答案是否。

   上述代码只能说是一个选课模板。如果你完全参照这个模板来，并直接运行，是肯定有问题的。因为运行期间代码大概率是会报错的。


> [!tip|label:更多内容]
>
> 到这里，如果你对其中的解决方案感兴趣的话，那么你可以继续深入了解[智能抢课系统](/snatcher/introduce)的底层实现原理。