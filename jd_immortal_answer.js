/*
京东神仙书院答题
根据bing搜索结果答题，常识题可对，商品题不能保证胜率
活动时间:2021-1-27至2021-2-5
活动入口: 京东APP我的-神仙书院
活动地址：https://h5.m.jd.com//babelDiy//Zeus//4XjemYYyPScjmGyjej78M6nsjZvj//index.html?babelChannel=ttt9
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京东神仙书院答题
20 8 * * * https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_immortal_answer.js, tag=京东神仙书院答题, img-url=https://raw.githubusercontent.com/Orz-3/task/master/jd.png, enabled=true

================Loon==============
[Script]
cron "20 8 * * *" script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_immortal_answer.js,tag=京东神仙书院答题

===============Surge=================
京东神仙书院答题 = type=cron,cronexp="20 8 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_immortal_answer.js

============小火箭=========
京东神仙书院答题 = type=cron,script-path=https://raw.githubusercontent.com/LXK9301/jd_scripts/master/jd_immortal_answer.js, cronexpr="20 8 * * *", timeout=3600, enable=true
 */
const $ = new require('./Env.min').Env('京东神仙书院答题');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
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

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  await requireTk()
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
      await jdImmortalAnswer()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function jdImmortalAnswer() {
  try {
    $.risk = false
    $.earn = 0
    await getHomeData()
    if ($.risk) return
    await getQuestions()
    await showMsg()
  } catch (e) {
    $.logErr(e)
  }
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

function showMsg() {
  return new Promise(resolve => {
    message += `本次运行获得${$.earn}积分`
    if (!jdNotify) {
      $.msg($.name, '', `${message}`);
    } else {
      $.log(`京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve()
  })
}

function getQuestions() {
  return new Promise((resolve) => {
    $.get(taskUrl('mcxhd_brandcity_getQuestions'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data && data['retCode'] === "200") {
            console.log(`答题开启成功`)
            let i = 0, questionList = []
            for (let vo of data.result.questionList) {
              $.question = vo
              let option = null, hasFound = false

              console.log(`去查询第${++i}题：【${vo.questionStem}】`)
              let ques = $.tk.filter(qo => qo.questionId === vo.questionId)

              if (ques.length) {
                ques = ques[0]
                let ans = JSON.parse(ques.correct)
                let opt = vo.options.filter(bo => bo.optionDesc === ans.optionDesc)
                if (opt.length) {
                  console.log(`在题库中找到题啦～`)
                  option = opt[0]
                  hasFound = true
                }
              }

              if (!option) {
                console.log(`在题库中未找到题`)
                let ans = -1
                for (let opt of vo.options) {
                  let str = vo.questionStem + opt.optionDesc
                  console.log(`去搜索${str}`)
                  let res = await bing(str)
                  if (res > ans) {
                    option = opt
                    ans = res
                  }
                  await $.wait(2 * 1000)
                }
                if (!option) {
                  option = vo.options[1]
                  console.log(`未找到答案，都选B【${option.optionDesc}】\n`)
                } else {
                  console.log(`选择搜索返回结果最多的一项【${option.optionDesc}】\n`)
                }
              }

              let b = {
                "questionToken": vo.questionToken,
                "optionId": option.optionId
              }
              $.option = option
              await answer(b)
              if (!hasFound) questionList.push($.question)
              if (i < data.result.questionList.length) {
                if (hasFound)
                  await $.wait(2 * 1000)
                else
                  await $.wait(5 * 1000)
              }
            }
            for (let vo of questionList) {
              $.question = vo
              await submitQues({
                ...$.question,
                options: JSON.stringify($.question.options),
                correct: JSON.stringify($.question.correct),
              })
            }
          } else {
            console.log(`答题开启失败`)
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

function submitQues(question) {
  return new Promise(resolve => {
    $.post({
      'url': 'http://qa.turinglabs.net:8081/api/v1/question',
      'headers': {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(question),
    }, (err, resp, data) => {
      try {
        data = JSON.parse(data)
        if (data.status === 200) {
          console.log(`提交成功`)
        } else {
          console.log(`提交失败`)
        }
        resolve()
      } catch (e) {
        console.log(e)
      } finally {
        resolve()
      }
    })
  })
}

function answer(body = {}) {
  return new Promise((resolve) => {
    $.get(taskUrl('mcxhd_brandcity_answerQuestion', {"costTime": 1, ...body}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          // console.log(data)
          if (data && data['retCode'] === "200") {
            if (data.result.isCorrect) {
              console.log(`您选对啦！获得积分${data.result.score}，本次答题共计获得${data.result.totalScore}分`)
              $.earn += parseInt(data.result.score)
              $.question = {
                ...$.question,
                correct: $.option
              }
            } else {
              let correct = $.question.options.filter(vo => vo.optionId === data.result.correctOptionId)[0]
              console.log(`您选错啦～正确答案是：${correct.optionDesc}`)
              $.question = {
                ...$.question,
                correct: correct
              }
            }
            if (data.result.isLastQuestion) {
              console.log(`答题完成`)
            }
          } else {
            console.log(`答题失败`)
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

function bing(str) {
  return new Promise(resolve => {
    $.get({
      url: `https://www.bing.com/search?q=${str}`,
      headers: {
        'Connection': 'Keep-Alive',
        'Accept': 'text/html, application/xhtml+xml, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4371.0 Safari/537.36'
      }
    }, (err, resp, data) => {
      try {
        let num = parseInt(data.match(/="sb_count">(.*) 条结果<\/span>/)[1].split(',').join(''))
        console.log(`找到结果${num}个`)
        resolve(num)
      } catch (e) {
        console.log(e)
      } finally {
        resolve()
      }
    })
  })

}

function taskUrl(function_id, body = {}, function_id2) {
  body = {"token": 'jd17919499fb7031e5', ...body}
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&appid=publicUseApi&t=${new Date().getTime()}&sid=&uuid=&area=&networkType=wifi`,
    headers: {
      "Cookie": cookie,
      'Accept': "application/json, text/plain, */*",
      'Accept-Language': 'zh-cn',
      "origin": "https://h5.m.jd.com",
      "referer": "https://h5.m.jd.com/babelDiy/Zeus/4XjemYYyPScjmGyjej78M6nsjZvj/index.html",
      'Content-Type': 'application/x-www-form-urlencoded',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
    }
  }
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

function requireTk() {
  return new Promise(resolve => {
    $.get({
      url: `http://qn6l5d6wm.hn-bkt.clouddn.com/question.json?t=${new Date().getTime()}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4371.0 Safari/537.36'
      }
    }, (err, resp, data) => {
      try {
        $.tk = JSON.parse(data).RECORDS
      } catch (e) {
        console.log(e)
      } finally {
        resolve()
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