# BilibiliUserChecker

 B站用户成分查询 / 一键查成分

## Credit

修改自[A畜3畜野狗大杂烩指示器](https://greasyfork.org/zh-CN/scripts/451236)

## 效果

| 评论区                                                                                                                 | 个人主页                                                                                                                |
|:-------------------------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------:|
| ![20231112221627](https://github.com/klxf/BilibiliUserChecker/assets/31070597/b2061a64-9836-4409-b234-56684470fe10) | ![20231112222118](https://github.com/klxf/BilibiliUserChecker/assets/31070597/563aae10-c04d-452e-b9ab-680b960d2962) |

## 安装

- [Greasy Fork](https://greasyfork.org/zh-CN/scripts/479621)

## 使用

安装脚本后，评论区和个人主页将出现“查成分”的按钮，点击后即可显示。

## 配置

自行修改`checkers`内的规则即可，下面是一个例子：

```
{
    displayName: "原神",
    displayIcon: "https://i2.hdslb.com/bfs/face/d2a95376140fb1e5efbcbed70ef62891a3e5284f.jpg@240w_240h_1c_1s.jpg",
    keywords: ["互动抽奖 #原神", "米哈游", "#米哈游#", "#miHoYo#", "原神"],
    followings: [401742377, 1872522256, 1593381854]
}
```

| 字段            | 描述         |
|:------------- |:---------- |
| `displayName` | 展示的名称      |
| `displayIcon` | 展示的图标链接    |
| `keywords`    | 识别的关键字     |
| `followings`  | 关注特点用户的UID |

## 计划

- [ ] 在网页增加添加规则的UI

## 其他

- 脚本内置的`checkers`不针对任何组织或个人
- 本脚本仅供娱乐，请勿借此攻击他人
