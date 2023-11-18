// ==UserScript==
// @name         B站用户成分指示器
// @version      2.3
// @author       klxf, trychen, miayoshi
// @namespace    https://github.com/klxf
// @license      GPLv3
// @description  自动标注成分
// @match        https://space.bilibili.com/*
// @match        https://t.bilibili.com/*
// @match        https://www.bilibili.com/read/*
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/v/topic/detail/*
// @match        https://www.bilibili.com/opus/*
// @icon         https://static.hdslb.com/images/favicon.ico
// @connect      bilibili.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.1/jquery.min.js
// ==/UserScript==

const blog = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?&host_mid='
const followapi = 'https://api.bilibili.com/x/relation/followings?vmid='
const medalapi = 'https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id='

$(function () {
    'use strict';
    const default_checkers = [
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

    // 读取保存的设置，若不存在则读取默认
    if(GM_getValue("settings") == undefined)
        GM_setValue("settings", default_checkers)
    var checkers = GM_getValue("settings")

    // 注册设置按钮
    addSettingsDialog()
    GM_registerMenuCommand('设置', openSettingsMenu);
    function openSettingsMenu() {
        $(".checkerSettings").show()
    }

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
    .checkerSettings {
        display: none;
        position: fixed;
        top: 10%;
        left: 10px;
        height: 80%;
        width: 400px;
        overflow-y: auto;
        background: #fff;
        z-index: 10;
        box-shadow: 2px 2px 5px 0px rgba(0, 0, 0, .5);
    }
    .menuTab {
        position: fixed;
        background: #fff;
    }
    .menuTitle {
        margin: 10px 20px;
        width: 350px;
        padding-left: 5px;
        font-size: 24px;
        font-weight: bold;
        border-left: var(--Lb5) 5px solid;
    }
    .menuItems {
        margin: 60px 20px;
        padding-left: 5px;
    }
    .menuItems p {
        margin: 5px 0;
    }
    .checker {
        margin-bottom: 10px;
        padding: 5px;
    }
    .checker:hover {
        background: #eee;
    }
    .checker .icon {
        width: 50px;
        height: 50px;
        margin-right: 10px;
    }
    .checker .displayName {
        display: block;
        font-weight: bold;
        margin-bottom: 5px;
    }
    .checker .keywords {
        font-size: 14px;
        color: gray;
    }
    .checker .followings {
        font-size: 14px;
        color: blue;
    }
    .input-container {
        margin-bottom: 10px;
    }
    .input-label {
        display: block;
        margin-bottom: 5px;
    }
    .input-field {
        width: 100%;
        padding: 5px;
        margin-bottom: 10px;
    }
    .input-field:invalid {
        background-color: lightpink;
    }
    .save-button {
        padding: 10px 20px;
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
    }
    .save-button:hover {
        background-color: #45a049;
    }
    .edit-button {
        padding: 5px 10px;
        background-color: #2196F3;
        color: white;
        border: none;
        cursor: pointer;
        margin-left: 10px;
        float: right;
    }
    .edit-button:hover {
        background-color: #0b7dda;
    }
    .delete-button {
        padding: 5px 10px;
        background-color: #f32121;
        color: white;
        border: none;
        cursor: pointer;
        margin-left: 10px;
        float: right;
    }
    .delete-button:hover {
        background-color: #da0b15;
    }
    .export-button {
        padding: 5px 10px;
        background-color: #2196f3;
        color: white;
        border: none;
        cursor: pointer;
        margin-left: 10px;
    }
    .export-button:hover {
        background-color: #0b7dda;
    }
    .import-button {
        padding: 5px 10px;
        background-color: #2196f3;
        color: white;
        border: none;
        cursor: pointer;
        margin-left: 10px;
    }
    .import-button:hover {
        background-color: #0b7dda;
    }
    #msgDisplay {
        color: lightpink;
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

    // 添加设置窗口
    function addSettingsDialog() {
        let menu = `<div class="checkerSettings">
    <div class="menuTab"><div class="menuTitle">设置菜单<span onClick="this.parentNode.parentNode.parentNode.style.display = 'none'" style="float: right; font-size: 14px;">关闭</span></div></div>
    <div class="menuItems">
            <div class="input-container">
            <label class="input-label" for="displayNameInput">展示名称：</label>
            <input id="displayNameInput" class="input-field" type="text">
        </div>
        <div class="input-container">
            <label class="input-label" for="displayIconInput">展示图标链接：</label>
            <input id="displayIconInput" class="input-field" type="text" placeholder="以https://或http://开头" pattern="^((http://)|(https://)).*$">
        </div>
        <div class="input-container">
            <label class="input-label" for="keywordsInput">关键词：</label>
            <input id="keywordsInput" class="input-field" type="text" placeholder="（可选）可输入多个，使用英文逗号分割">
        </div>
        <div class="input-container">
            <label class="input-label" for="followingsInput">UID：</label>
            <input id="followingsInput" class="input-field" type="text" placeholder="（可选）可输入多个，使用英文逗号分割" pattern="^[0-9, ]+$">
        </div>
        <button id="saveButton" class="save-button">保存</button>
        <div id="checkersContainer"></div>
        <button id="exportButton" class="export-button">导出到剪切板</button>
        <button id="importButton" class="import-button">从剪切板导入</button>
        <div id="msgDisplay"></div>

        <script>
            var checker_list = ` + JSON.stringify(GM_getValue("settings")) + `;

            var checkersContainer = document.getElementById("checkersContainer");
            var displayNameInput = document.getElementById("displayNameInput");
            var displayIconInput = document.getElementById("displayIconInput");
            var keywordsInput = document.getElementById("keywordsInput");
            var followingsInput = document.getElementById("followingsInput");
            var saveButton = document.getElementById("saveButton");

            var update_token = 0;

            saveButton.addEventListener("click", function() {
                var displayName = displayNameInput.value;
                var displayIcon = displayIconInput.value;
                var keywords = keywordsInput.value.split(",").map(function(keyword) {
                    return keyword.trim();
                });
                var followings = followingsInput.value.split(",").map(function(following) {
                    return parseInt(following.trim());
                });

                if (displayName && displayIcon && keywords.length > 0 && followings.length > 0) {
                    var existingChecker = findChecker(displayName);

                    if (existingChecker) {
                        // Update the properties of the existing checker
                        existingChecker.displayIcon = displayIcon;
                        existingChecker.keywords = keywords;
                        existingChecker.followings = followings;
                    } else {
                        // Create a new checker and add it to the checkers array
                        var newChecker = {
                            displayName: displayName,
                            displayIcon: displayIcon,
                            keywords: keywords,
                            followings: followings
                        };

                        checker_list.push(newChecker);
                    }

                    renderCheckers();
                    clearInputs();
                }
                
                update_token = 1;
            });

            function findChecker(displayName) {
                for (var i = 0; i < checker_list.length; i++) {
                    if (checker_list[i].displayName === displayName) {
                        return checker_list[i];
                    }
                }
                return null;
            }

            function renderCheckers() {
                checkersContainer.innerHTML = "";

                checker_list.forEach(function(checker, index) {
                    var checkerElement = document.createElement("div");
                    checkerElement.className = "checker";

                    var iconElement = document.createElement("img");
                    iconElement.className = "icon";
                    iconElement.src = checker.displayIcon;

                    var displayNameElement = document.createElement("span");
                    displayNameElement.className = "displayName";
                    displayNameElement.textContent = checker.displayName;

                    var keywordsElement = document.createElement("p");
                    keywordsElement.className = "keywords";
                    keywordsElement.textContent = checker.keywords.join(", ");

                    var followingsElement = document.createElement("p");
                    followingsElement.className = "followings";
                    followingsElement.textContent = checker.followings.join(", ");

                    var editButton = document.createElement("button");
                    editButton.className = "edit-button";
                    editButton.textContent = "编";
                    editButton.addEventListener("click", function() {
                        fillInputs(checker);
                    });

                    var deleteButton = document.createElement("button");
                    deleteButton.className = "delete-button";
                    deleteButton.textContent = "删";
                    deleteButton.addEventListener("click", createDeleteHandler(checker.displayName));

                    checkerElement.appendChild(displayNameElement);
                    checkerElement.appendChild(iconElement);
                    checkerElement.appendChild(deleteButton);
                    checkerElement.appendChild(editButton);
                    checkerElement.appendChild(keywordsElement);
                    checkerElement.appendChild(followingsElement);

                    checkersContainer.appendChild(checkerElement);
                });
            }

            function createDeleteHandler(displayName) {
                return function() {
                    deleteChecker(displayName);
                };
            }

            function deleteChecker(displayName) {
                for (var i = 0; i < checker_list.length; i++) {
                    if (checker_list[i].displayName === displayName) {
                        checker_list.splice(i, 1);
                        break;
                    }
                }

                update_token = 1;

                renderCheckers();
            }

            function fillInputs(checker) {
                displayNameInput.value = checker.displayName;
                displayIconInput.value = checker.displayIcon;
                keywordsInput.value = checker.keywords.join(", ");
                followingsInput.value = checker.followings.join(", ");
            }

            function clearInputs() {
                displayNameInput.value = "";
                displayIconInput.value = "";
                keywordsInput.value = "";
                followingsInput.value = "";
            }
            
			var msgDisplay = document.getElementById("msgDisplay");
            var exportButton = document.getElementById("exportButton");
            exportButton.addEventListener("click", function() {
                exportCheckers();
            });
			
            var importButton = document.getElementById("importButton");
            importButton.addEventListener("click", function() {
                importCheckers();
            });
			
            function exportCheckers() {
                var checkersText = JSON.stringify(checker_list, null, 2);
                navigator.clipboard.writeText(checkersText)
                    .then(function() {
                        msgDisplay.textContent = "规则导出成功";
                    })
                    .catch(function(error) {
                        msgDisplay.textContent = "导出失败: " + error;
                    });
            }
            function importCheckers() {
                navigator.clipboard.readText()
                    .then(function(text) {
                        var importedCheckers = JSON.parse(text);
                        if (validateCheckers(importedCheckers)) {
                            checker_list = importedCheckers;
                            renderCheckers();
                            msgDisplay.textContent = "规则导入成功";
                            update_token = 1;
                        } else {
                            msgDisplay.textContent = "导入失败: 剪切板内容无效或不完整";
                        }
                    })
                    .catch(function(error) {
                        msgDisplay.textContent = "导入失败: " + error;
                    });
            }


            function validateCheckers(checkers) {
                if (!Array.isArray(checkers)) {
                    return false;
                }

                for (var i = 0; i < checkers.length; i++) {
                    var checker = checkers[i];
                    if (typeof checker !== "object" ||
                        !checker.hasOwnProperty("displayIcon") ||
                        !checker.hasOwnProperty("displayName") ||
                        !checker.hasOwnProperty("followings") ||
                        !checker.hasOwnProperty("keywords")) {
                        return false;
                    }
                }

                return true;
            }

            renderCheckers();
        </script>
    </div>
</div>
        `
        $("body").append(menu)
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
                    if(update_token == 1) {
                        console.log("更新")
                        GM_setValue("settings", checker_list)
                        update_token = 0
                    }
                    checkers = GM_getValue("settings")
                }, 300);
                controlObj [controlKey] = timeControl;
            }
        }
        listenKey.controlObj = controlObj;
    }
})