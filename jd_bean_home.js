/*
领京豆额外奖励&抢京豆
脚本自带助力码，介意者可将 29行 helpAuthor 变量设置为 false
活动入口：京东APP首页-领京豆
更新地址：https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_bean_home.js
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#领京豆额外奖励
10 7 * * * https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_bean_home.js, tag=领京豆额外奖励, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_bean_home.png, enabled=true

================Loon==============
[Script]
cron "10 7 * * *" script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_bean_home.js, tag=领京豆额外奖励

===============Surge=================
领京豆额外奖励 = type=cron,cronexp="10 7 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_bean_home.js

============小火箭=========
领京豆额外奖励 = type=cron,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_bean_home.js, cronexpr="10 7 * * *", timeout=3600, enable=true
 */
const $ = new require('./Env.min').Env('领京豆额外奖励');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
const helpAuthor = true; // 是否帮助作者助力，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}
const JD_API_HOST = 'https://api.m.jd.com/';
!(async () => {
  $.newShareCodes = []
  // await getAuthorShareCode();
  // await getAuthorShareCode2();
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await jdBeanHome();
    }
  }
  // for (let i = 0; i < cookiesArr.length; i++) {
  //   if (cookiesArr[i]) {
  //     $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
  //     console.log(`${$.UserName}去帮助下一个人`)
  //     cookie = cookiesArr[i];
  //     if ($.newShareCodes.length > 1) {
  //       let code = $.newShareCodes[(i + 1) % $.newShareCodes.length]
  //       await help(code[0], code[1])
  //     }
  //     if (helpAuthor && $.authorCode) {
  //       console.log(`去帮助作者`)
  //       const helpRes = await help($.authorCode[0], $.authorCode[1])
  //       if (helpRes && helpRes.data.respCode === 'SG209') {
  //         console.log(`助力次数已耗尽，跳出助力`)
  //         break;
  //       }
  //     }
  //     if (helpAuthor && $.authorCode2) {
  //       for (let code of $.authorCode2) {
  //         const helpRes = await help(code.shareCode, code.groupCode);
  //         if (helpRes && helpRes.data.respCode === 'SG209') {
  //           console.log(`助力次数已耗尽，跳出助力`)
  //           break;
  //         }
  //       }
  //     }
  //   }
  // }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function jdBeanHome() {
  $.doneState = false
  // for (let i = 0; i < 3; ++i) {
  //   await doTask2()
  //   await $.wait(1000)
  //   if ($.doneState) break
  // }
  do {
    await doTask2()
    await $.wait(3000)
  } while (!$.doneState)
  await $.wait(1000)
  await award("feeds")
  await $.wait(1000)
  await getUserInfo()
  await $.wait(1000)
  await getTaskList()
  await showMsg();
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
function doTask2() {
    return new Promise(resolve => {
      const body = {"awardFlag": false, "skuId": `${getRandomInt(10000000,20000000)}`, "source": "feeds", "type": '1'};
      $.post(taskUrl('beanHomeTask', body), (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`)
            console.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if (data.code === '0' && data.data){
                console.log(`任务完成进度：${data.data.taskProgress} / ${data.data.taskThreshold}`)
                if(data.data.taskProgress === data.data.taskThreshold)
                  $.doneState = true
              } else if (data.code === '0' && data.errorCode === 'HT201') {
                $.doneState = true
              } else {
                //HT304风控用户
                $.doneState = true
                console.log(`做任务异常：${JSON.stringify(data)}`)
              }
            }
          }
        } catch (e) {
          $.logErr(e, resp)
        } finally {
          resolve();
        }
      })
    })
}

function getAuthorShareCode() {
  return new Promise(resolve => {
    $.get({url: "https://gitee.com/shylocks/updateTeam/raw/main/jd_bean_home",headers:{
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
      }}, async (err, resp, data) => {
      try {
        if (err) {
        } else {
          $.authorCode = data.replace('\n', '').split(' ')
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function getAuthorShareCode2() {
  return new Promise(resolve => {
    $.get({url: "https://gitee.com/lxk0301/updateTeam/raw/master/jd_updateBeanHome.json",headers:{
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
      }}, async (err, resp, data) => {
      try {
        if (err) {
        } else {
          if (safeGet(data)) {
            $.authorCode2 = JSON.parse(data);
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function getUserInfo() {
  return new Promise(resolve => {
    $.post(taskUrl('signBeanGroupStageIndex', 'body'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if(data.data.jklInfo) {
              $.actId = data.data.jklInfo.keyId
              let {shareCode, groupCode} = data.data
              if (!shareCode) {
                console.log(`未获取到助力码，去开团`)
                await hitGroup()
              } else {
                console.log(shareCode, groupCode)
                // 去做逛会场任务
                if (data.data.beanActivityVisitVenue.taskStatus === '0') {
                  await help(shareCode, groupCode, 1)
                }
                $.newShareCodes.push([shareCode, groupCode])
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function hitGroup() {
  return new Promise(resolve => {
    const body = {"activeType": 2,};
    $.get(taskGetUrl('signGroupHit', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.respCode === "SG150") {
              let {shareCode, groupCode} = data.data.signGroupMain
              if (shareCode) {
                $.newShareCodes.push([shareCode, groupCode])
                console.log('开团成功')
                await help(shareCode, groupCode, 1)
              } else {
                console.log(`为获取到助力码，错误信息${JSON.stringify(data.data)}`)
              }
            } else {
              console.log(`开团失败，错误信息${JSON.stringify(data.data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function help(shareCode, groupCode, isTask = 0) {
  return new Promise(resolve => {
    const body = {
      "activeType": 2,
      "groupCode": groupCode,
      "shareCode": shareCode,
      "activeId": $.actId,
    };
    if (isTask) {
      console.log(`【抢京豆】做任务获取助力`)
      body['isTask'] = "1"
    } else {
      console.log(`【抢京豆】去助力好友${shareCode}`)
      body['source'] = "guest"
    }
    $.get(taskGetUrl('signGroupHelp', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`【抢京豆】${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            console.log(`【抢京豆】${data.data.helpToast}`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function showMsg() {
  return new Promise(resolve => {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve()
  })
}

function getTaskList() {
  return new Promise(resolve => {
    const body = {"rnVersion": "4.7", "rnClient": "2", "source": "AppHome"};
    $.post(taskUrl('findBeanHome', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            let beanTask = data.data.floorList.filter(vo => vo.floorName === "种豆得豆定制化场景")[0]
            if (!beanTask.viewed) {
              await receiveTask()
              await $.wait(3000)
            }

            let tasks = data.data.floorList.filter(vo => vo.floorName === "赚京豆")[0]['stageList']
            for (let i = 0; i < tasks.length; ++i) {
              const vo = tasks[i]
              if (vo.viewed) continue
              await receiveTask(vo.stageId, `4_${vo.stageId}`)
              await $.wait(3000)
            }
            await award()
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function receiveTask(itemId = "zddd", type = "3") {
  return new Promise(resolve => {
    const body = {"awardFlag": false, "itemId": itemId, "source": "home", "type": type};
    $.post(taskUrl('beanHomeTask', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data) {
              console.log(`完成任务成功，进度${data.data.taskProgress}/${data.data.taskThreshold}`)
            } else {
              console.log(`完成任务失败，${data.errorMessage}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}


function award(source="home") {
  return new Promise(resolve => {
    const body = {"awardFlag": true, "source": source};
    $.post(taskUrl('beanHomeTask', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data) {
              console.log(`领奖成功，获得 ${data.data.beanNum} 个京豆`)
              message += `领奖成功，获得 ${data.data.beanNum} 个京豆\n`
            } else {
              console.log(`领奖失败，${data.errorMessage}`)
              message += `领奖失败，${data.errorMessage}\n`
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function taskGetUrl(function_id, body) {
  return {
    url: `${JD_API_HOST}client.action?functionId=${function_id}&body=${escape(JSON.stringify(body))}&appid=ld&clientVersion=9.2.0`,
    headers: {
      'Cookie': cookie,
      'Host': 'api.m.jd.com',
      'Accept': '*/*',
      'Connection': 'keep-alive',
      'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
      'Accept-Language': 'zh-Hans-CN;q=1,en-CN;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': "application/x-www-form-urlencoded"
    }
  }
}


function taskUrl(function_id, body) {
  body["version"] = "9.0.0.1";
  body["monitor_source"] = "plant_app_plant_index";
  body["monitor_refer"] = "";
  return {
    url: JD_API_HOST,
    body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&appid=ld&client=apple&area=5_274_49707_49973&build=167283&clientVersion=9.1.0`,
    headers: {
      'Cookie': cookie,
      'Host': 'api.m.jd.com',
      'Accept': '*/*',
      'Connection': 'keep-alive',
      'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
      'Accept-Language': 'zh-Hans-CN;q=1,en-CN;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': "application/x-www-form-urlencoded"
    }
  }
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            $.nickName = data['base'].nickname;
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}