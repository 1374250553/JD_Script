/*
京东神仙书院
活动时间:2021-1-20至2021-2-5
暂不加入品牌会员，需要自行填写坐标，用于做逛身边好店任务
环境变量：JD_IMMORTAL_LATLON(经纬度)
示例：JD_IMMORTAL_LATLON={"lat":33.1, "lng":118.1}
boxjs IMMORTAL_LATLON
活动入口：京东APP我的-神仙书院
地址：https://h5.m.jd.com//babelDiy//Zeus//4XjemYYyPScjmGyjej78M6nsjZvj//index.html?babelChannel=ttt9
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东神仙书院
20 8 * * * https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_immortal.js, tag=京东神仙书院, img-url=https://raw.githubusercontent.com/Orz-3/task/master/jd.png, enabled=true

================Loon==============
[Script]
cron "20 8 * * *" script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_immortal.js,tag=京东神仙书院

===============Surge=================
京东神仙书院 = type=cron,cronexp="20 8 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_immortal.js

============小火箭=========
京东神仙书院 = type=cron,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_immortal.js, cronexpr="20 8 * * *", timeout=3600, enable=true
 */
const $ = new require('./Env.min').Env('京东神仙书院');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
const randomCount = $.isNode() ? 20 : 5;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
const inviteCodes = [];
!(async () => {
  await requireConfig();
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      inviteCodes[i] = '';
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
      await shareCodesFormat();
      await jdNian()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function jdNian() {
  try {
    $.risk = false
    await getHomeData()
    if ($.risk) return
    await getTaskList($.cor)
    await $.wait(2000)
    await helpFriends()
    await $.wait(2000)
    await getHomeData(true)
    await showMsg()
  } catch (e) {
    $.logErr(e)
  }
}

function showMsg() {
  return new Promise(resolve => {
    message += `本次运行获得${$.earn}金币，当前${$.coin}金币`
    if (!jdNotify) {
      $.msg($.name, '', `${message}`);
    } else {
      $.log(`京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve()
  })
}

async function helpFriends() {
  for (let code of $.newShareCodes) {
    if (!code) continue
    await doTask(code)
    await $.wait(2000)
  }
}

function doTask(itemToken) {
  return new Promise((resolve) => {
    $.post(taskPostUrl('mcxhd_brandcity_doTask', {itemToken: itemToken}, 'mcxhd_brandcity_doTask'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data && data['retCode'] === "200") {
            if (data.result.score)
              console.log(`任务完成成功，获得${data.result.score}金币`)
            else if (data.result.taskToken)
              console.log(`任务请求成功，等待${$.duration}秒`)
            else {
              console.log(`任务请求结果未知`)
            }
          } else {
            console.log(data.retMessage)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    })
  })
}

function doTask2(taskToken) {
  let body = {
    "dataSource": "newshortAward",
    "method": "getTaskAward",
    "reqParams": `{\"taskToken\":\"${taskToken}\"}`
  }
  return new Promise(resolve => {
    $.post(taskPostUrl2("qryViewkitCallbackResult", body,), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === "0") {
              console.log(data.toast.subTitle)
            } else {
              console.log(`任务完成失败，错误信息：${JSON.stringify(data)}`)
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

function getHomeData(info = false) {
  return new Promise((resolve) => {
    $.post(taskPostUrl('mcxhd_brandcity_homePage'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data && data['retCode'] === "200") {
            const {userCoinNum} = data.result
            if (info) {
              $.earn = userCoinNum - $.coin
            } else {
              console.log(`当前用户金币${userCoinNum}`)
            }
            $.coin = userCoinNum
          } else {
            $.risk = true
            console.log(`账号被风控，无法参与活动`)
            message += `账号被风控，无法参与活动\n`
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    })
  })
}

function getTaskList(body = {}) {

  return new Promise(resolve => {
    $.post(taskPostUrl("mcxhd_brandcity_taskList", body, "mcxhd_brandcity_taskList"), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            $.tasks = []
            if (data.retCode === '200') {
              $.tasks = data.result.tasks
              for (let vo of $.tasks) {
                if (vo.taskType === "13" || vo.taskType === "2" || vo.taskType === "5" || vo.taskType === "3") {
                  // 签到，逛一逛
                  for (let i = vo.times, j = 0; i < vo.maxTimes && j < vo.subItem.length; ++i, ++j) {
                    console.log(`去做${vo.taskName}任务，${i + 1}/${vo.maxTimes}`)
                    let item = vo['subItem'][j]
                    await doTask(item['itemToken'])
                    await $.wait((vo.waitDuration ? vo.waitDuration : 5 + 1) * 1000)
                  }
                } else if (vo.taskType === "7" || vo.taskType === "9") {
                  // 浏览店铺，会场
                  for (let i = vo.times, j = 0; i < vo.maxTimes; ++i, ++j) {
                    console.log(`去做${vo.taskName}任务，${i + 1}/${vo.maxTimes}`)
                    let item = vo['subItem'][j]
                    $.duration = vo.waitDuration + 1
                    await doTask(item['itemToken'])
                    await $.wait((vo.waitDuration + 1) * 1000)
                    await doTask2(item['taskToken'])
                  }
                } else if (vo.taskType === "6") {
                  // 邀请好友
                  if (vo.subItem.length) {
                    console.log(`您的好友助力码为${vo.subItem[0].itemToken}`)
                  } else {
                    console.log(`无法查询您的好友助力码`)
                  }
                }
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

function readShareCode() {
  console.log(`开始`)
  return new Promise(async resolve => {
    $.get({
      url: `http://jd.turinglabs.net/api/v2/jd/immortal/read/${randomCount}/`,
      'timeout': 10000
    }, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            console.log(`随机取${randomCount}个码放到您固定的互助码后面(不影响已有固定互助)`)
            data = JSON.parse(data);
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
    await $.wait(2000);
    resolve()
  })
}

//格式化助力码
function shareCodesFormat() {
  return new Promise(async resolve => {
    // console.log(`第${$.index}个京东账号的助力码:::${$.shareCodesArr[$.index - 1]}`)
    $.newShareCodes = [];
    if ($.shareCodesArr[$.index - 1]) {
      $.newShareCodes = $.shareCodesArr[$.index - 1].split('@');
    } else {
      console.log(`由于您第${$.index}个京东账号未提供shareCode,将采纳本脚本自带的助力码\n`)
      const tempIndex = $.index > inviteCodes.length ? (inviteCodes.length - 1) : ($.index - 1);
      $.newShareCodes = inviteCodes[tempIndex].split('@');
    }
    const readShareCodeRes = await readShareCode();
    if (readShareCodeRes && readShareCodeRes.code === 200) {
      $.newShareCodes = [...new Set([...$.newShareCodes, ...(readShareCodeRes.data || [])])];
    }
    console.log(`第${$.index}个京东账号将要助力的好友${JSON.stringify($.newShareCodes)}`)
    resolve();
  })
}

function requireConfig() {
  return new Promise(async resolve => {
    console.log(`开始获取${$.name}配置文件\n`);
    //Node.js用户请在jdCookie.js处填写京东ck;
    let shareCodes = []
    console.log(`共${cookiesArr.length}个京东账号\n`);
    if ($.isNode() && process.env.JDSXSY_SHARECODES) {
      if (process.env.JDSXSY_SHARECODES.indexOf('\n') > -1) {
        shareCodes = process.env.JDSXSY_SHARECODES.split('\n');
      } else {
        shareCodes = process.env.JDSXSY_SHARECODES.split('&');
      }
    }
    $.shareCodesArr = [];
    if ($.isNode()) {
      Object.keys(shareCodes).forEach((item) => {
        if (shareCodes[item]) {
          $.shareCodesArr.push(shareCodes[item])
        }
      })
      $.cor = process.env.JD_IMMORTAL_LATLON ? JSON.parse(process.env.JD_IMMORTAL_LATLON) : (await getLatLng())
    } else {
      $.cor = $.getdata("IMMORTAL_LATLON") ? JSON.parse($.getdata("IMMORTAL_LATLON")) : {}
    }
    console.log(`您提供的地理位置信息为${JSON.stringify($.cor)}`)
    console.log(`您提供了${$.shareCodesArr.length}个账号的${$.name}助力码\n`);
    resolve()
  })
}

// 自动获取经纬度
function getLatLng() {
  return new Promise(resolve => {
    try {
      console.log('开始自动获取经纬度 lat lng ……');
      $.get({
        url: 'https://jingweidu.bmcx.com/web_system/bmcx_com_www/system/file/jingweidu/api/?v=20031911',
        headers: {
          "referer": "https://jingweidu.bmcx.com/",
          'Content-Type': 'text/html; charset=utf-8',
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36"
        }
      }, async (err, resp, data) => {
        const res = data.match(/qq\.maps\.LatLng\(([\d\.]+), ([\d\.]+)\)/);
        let lat = res[1];
        let lng = res[2];
        if (lat > 0 && lng > 0) {
          resolve({
            'lng': lng,
            'lat': lat
          });
          return;
        }
        console.log('自动获取经纬度 lat lng 失败，返回经纬度结果错误');
        resolve({});
      });
    } catch (e) {
      console.log('自动获取经纬度 lat lng 失败，触发异常');
      resolve({});
    }
  });
}

function taskPostUrl(function_id, body = {}, function_id2) {
  let url = `${JD_API_HOST}`;
  if (function_id2) {
    url += `?functionId=${function_id2}`;
  }
  body = {...body, "token": 'jd17919499fb7031e5'}
  return {
    url,
    body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&appid=publicUseApi`,
    headers: {
      "Cookie": cookie,
      "origin": "https://h5.m.jd.com",
      "referer": "https://h5.m.jd.com/",
      'Content-Type': 'application/x-www-form-urlencoded',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
    }
  }
}

function taskPostUrl2(function_id, body = {}, function_id2) {
  let url = `${JD_API_HOST}`;
  if (function_id2) {
    url += `?functionId=${function_id2}`;
  }
  return {
    url,
    body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0`,
    headers: {
      "Cookie": cookie,
      "origin": "https://h5.m.jd.com",
      "referer": "https://h5.m.jd.com/",
      'Content-Type': 'application/x-www-form-urlencoded',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
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