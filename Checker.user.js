// ==UserScript==
// @name         B站用户成分指示器
// @version      1.0
// @author       klxf, trychen, miayoshi
// @namespace    https://github.com/klxf
// @license      GPLv3
// @description  自动标注成分
// @match        https://space.bilibili.com/*
// @match        https://t.bilibili.com/*
// @match        https://www.bilibili.com/read/*
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/opus/*
// @icon         https://static.hdslb.com/images/favicon.ico
// @connect      bilibili.com
// @grant        GM_xmlhttpRequest
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.1/jquery.min.js
// ==/UserScript==

const blog = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?&host_mid='
const followapi = 'https://api.bilibili.com/x/relation/followings?vmid='
const medalapi = 'https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id='

$(function () {
    'use strict';
    const checkers = [
        {
            displayName: "永雏塔菲",
            displayIcon: "https://i1.hdslb.com/bfs/face/4907464999fbf2f2a6f9cc8b7352fceb6b3bfec3.jpg@240w_240h_1c_1s.jpg",
            keywords: ["谢谢喵", "taffy", "雏草姬"],
            followings: [1265680561]
        }
        ,
        {
            displayName: "東雪蓮",
            displayIcon: "https://i0.hdslb.com/bfs/face/ced15dc126348dc42bd5c8eefdd1de5e48bdd8e6.jpg@240w_240h_1c_1s.jpg",
            keywords: ["東雪蓮Official", "东雪莲", "莲宝"],
            followings: [1437582453]
        }
        ,
        {
            displayName: "原神",
            displayIcon: "https://i2.hdslb.com/bfs/face/d2a95376140fb1e5efbcbed70ef62891a3e5284f.jpg@240w_240h_1c_1s.jpg",
            keywords: ["互动抽奖 #原神", "米哈游", "#米哈游#", "#miHoYo#"],
            followings: [401742377, 1872522256, 1593381854]
        }
        ,
        {
            displayName: "星穹铁道",
            displayIcon: "https://i2.hdslb.com/bfs/face/e76fc676b58f23c6bd9161723f12da00c7e051c5.jpg@240w_240h_1c_1s.webp",
            keywords: ["互动抽奖 #崩坏星穹铁道"],
            followings: [1340190821]
        }
        ,
        {
            displayName: "绝区零",
            displayIcon: "https://i0.hdslb.com/bfs/face/049b47e0e73fc5cc1564343bb0aeacce8ae8e6f8.jpg",
            keywords: ["互动抽奖 #绝区零"],
            followings: [1636034895]
        }
        ,
        {
            displayName: "王者荣耀",
            displayIcon: "https://i2.hdslb.com/bfs/face/effbafff589a27f02148d15bca7e97031a31d772.jpg@240w_240h_1c_1s.jpg",
            keywords: ["互动抽奖 #王者荣耀","王者荣耀"],
            followings: [57863910]
        }
        ,
        {
            displayName: "明日方舟",
            displayIcon: "https://i0.hdslb.com/bfs/face/89154378c06a5ed332c40c2ca56f50cd641c0c90.jpg@240w_240h_1c_1s.jpg",
            keywords: ["互动抽奖 #明日方舟","危机合约","《明日方舟》"],
            followings: [161775300]
        }
    ]
    const checked = {}
    const checking = {}
    var printed = false

    // 监听用户ID元素出现
    listenKey(".user-name", addButton);
    listenKey(".sub-user-name", addButton);
    listenKey(".user .name", addButton);
    listenKey(".h #h-name", addSpaceButton);


    // 添加查成分按钮（评论区）
    function addButton(element) {
        let node = $(`<div style="display: inline; z-index: 1;" class="composition-checkable"><div class="iBadge">
  <a class="iName">查成分</a>
</div></div>`)

        node.on('click', function () {
            node.find(".iName").text("检查中...")
            checktag(element, node.find(".iName"))
        })

        element.after(node)
    }
	// 添加查成分按钮（个人主页）
    function addSpaceButton(element) {
        let box = $(`<div><div class="section"><h3 class="section-title">成分查询</h3><div style="margin: 30px 0 15px; text-align: center;" class="composition-checkable"></div></div></div>`)
        let node = $(`<div class="iBadge launcher">
  <a class="iName">查成分</a>
</div>`)

        node.on('click', function () {
            node.find(".iName").text("检查中...")
            checktag($("div.col-2:last-child > div:first-child > div.section > div.composition-checkable"), node.find(".iName"))
        })

        $("div.col-2:last-child").prepend(box)
        $("div.col-2:last-child > div:first-child > div.section > div.composition-checkable").prepend(node)
    }

    // 添加标签
    function addtag(id, element, setting) {
        let node = $(`<div style="display: inline; z-index: 1;"><div class="iBadge">
  <a class="iName">${setting.displayName}</a>
  <img src="${setting.displayIcon}" class="iIcon">
</div></div>`)

        element.after(node)
    }

    // 检查标签
    function checktag(element, loadingElement) {
        // 用户ID
        let UID = element.attr("data-user-id") || element.attr("data-usercard-mid")
        // 用户名
        let name = element.text().charAt(0) == "@" ? element.text().substring(1) : element.text()

        // 若在主页则在个人资料取uid
        if(UID == undefined && window.location.hostname == "space.bilibili.com")
            UID = $("div.info-personal > div.info-wrap:first-child > span.info-value:last-child").text()

        if (checked[UID]) {
            // 已经缓存过了
            for(let setting of checked[UID]) {
                addtag(UID, element, setting)
            }
            loadingElement.parent().remove()
        } else if (checking[UID] != undefined) {
            // 检查中
            if (checking[UID].indexOf(element) < 0)
                checking[UID].push(element)
        } else {
            checking[UID] = [element]

            // 获取最近动态
            GM_xmlhttpRequest({
                method: "get",
                url: blog + UID,
                data: '',
                headers:  {
                    'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
                },
                onload: res => {
                    if(res.status === 200) {
                        // 获取关注列表
                        GM_xmlhttpRequest({
                            method: "get",
                            url: followapi + UID,
                            data: '',
                            headers:  {
                                'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
                            },
                            onload: followingRes => {
                                if(followingRes.status === 200) {
									// 获取勋章列表
									GM_xmlhttpRequest({
										method: "get",
										url: medalapi + UID,
										data: '',
										headers:  {
											'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
										},
										onload: medalRes => {
											if(medalRes.status === 200) {
												// 查询关注列表
												let followingData = JSON.parse(followingRes.response)
												// 可能无权限
												let following = followingData.code == 0 ? followingData.data.list.map(it => it.mid) : []
												
												// 查询并拼接动态数据
												let st = JSON.stringify(JSON.parse(res.response).data.items)
												
												// 获取勋章列表
												let medalData = JSON.parse(medalRes.response)
												let medals = medalData.code == 0 ? medalData.data.list.map(it => it.medal_info.target_id) : []

												// 找到的匹配内容
												let found = []
												for(let setting of checkers) {
													// 检查动态内容
													if (setting.keywords)
														if (setting.keywords.find(keyword => st.includes(keyword))) {
															if (found.indexOf(setting) < 0)
																found.push(setting)
															continue;
														}

													// 检查关注列表
													if (setting.followings)
														for(let mid of setting.followings) {
															if (following.indexOf(mid) >= 0) {
																if (found.indexOf(setting) < 0)
																	found.push(setting)
																continue;
															}
														}

													// 检查勋章列表
													if (setting.followings)
														for(let target_id of setting.followings) {
															if (medals.indexOf(target_id) >= 0) {
																if (found.indexOf(setting) < 0)
																	found.push(setting)
																continue;
															}
														}
												}

												// 添加标签
												if (found.length > 0) {
													if (!printed) {
														// console.log(JSON.parse(res.response).data)
														printed = true
													}
													checked[UID] = found

													// 给所有用到的地方添加标签
													for (let element of checking[UID]) {
														for(let setting of found) {
															addtag(UID, element, setting)
														}
													}
													loadingElement.parent().remove()
												} else {
													loadingElement.text('无')
												}
											} else {
												loadingElement.text('失败')
											}

											delete checking[UID]
										},
										onerror: err => {
											loadingElement.text('失败')
											delete checking[UID]
										}
									})

                                } else {
                                    loadingElement.text('失败')
									delete checking[UID]
                                }
                            },
                            onerror: err => {
                                loadingElement.text('失败')
                                delete checking[UID]
                            }
                        })


                    } else {
                        loadingElement.text('失败')
                        delete checking[UID]
                    }
                },
                onerror: err => {
                    loadingElement.text('失败')
                    delete checking[UID]
                }
            });
        }
    }

    addGlobalStyle(`
    .iBadge {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      width: fit-content;
      background: #07beff26;
      border-radius: 10px;
      margin: -6px 0;
      margin: 0 5px;
      font-family: PingFang SC, HarmonyOS_Regular, Helvetica Neue, Microsoft YaHei, sans-serif;
    }
    .iName {
      line-height: 13px;
      font-size: 13px;
      color: #07beff;
      padding: 2px 8px;
    }
    .iIcon {
      width: 25px;
      height: 25px;
      border-radius: 50%;
      border: 2px solid white;
      margin: -6px;
      margin-right: 5px;
    }
    .user-info, .sub-user-info {
      width: max-content;
      background: #fff;
      padding: 0px 10px;
      border-radius: 6px;
      position: static;
    }
    .user-info .user-level {
      z-index: 1;
    }
   `)

    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }

    function listenKey(selectorTxt, actionFunction, bWaitOnce, iframeSelector) {
        var targetNodes, btargetsFound;

        if (typeof iframeSelector == "undefined")
            targetNodes = $(selectorTxt);
        else
            targetNodes = $(iframeSelector).contents ()
                .find (selectorTxt);

        if (targetNodes && targetNodes.length > 0) {
            btargetsFound = true;
            targetNodes.each ( function () {
                var jThis  = $(this);
                var alreadyFound = jThis.data ('alreadyFound')  ||  false;

                if (!alreadyFound) {
                    //--- Call the payload function.
                    var cancelFound = actionFunction (jThis);
                    if (cancelFound) btargetsFound = false;
                    else jThis.data ('alreadyFound', true);
                }
            } );
        } else {
            btargetsFound = false;
        }

        var controlObj = listenKey.controlObj  ||  {};
        var controlKey = selectorTxt.replace (/[^\w]/g, "_");
        var timeControl = controlObj [controlKey];

        //--- Now set or clear the timer as appropriate.
        if (btargetsFound && bWaitOnce && timeControl) {
            clearInterval (timeControl);
            delete controlObj [controlKey]
        } else {
            //设置定时器
            if ( ! timeControl) {
                timeControl = setInterval ( function () {
                    listenKey(selectorTxt,actionFunction,bWaitOnce,iframeSelector);
                }, 300);
                controlObj [controlKey] = timeControl;
            }
        }
        listenKey.controlObj = controlObj;
    }
})
