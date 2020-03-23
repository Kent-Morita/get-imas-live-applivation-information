const express = require('express');
const linebot = require('linebot');
const router = express.Router();
const bodyParser = require('body-parser');
const cheerio = require('cheerio-httpcli');
const bot = linebot({
    channelId: process.env.LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const parser = bodyParser.json({
    verify: (req, res, buf, encoding) => {
        req.rawBody = buf.toString(encoding);
    }
});

router.post('/', parser, (req, res, next) => {
    if (req.body.events === '') {
        return;
    }
    if (!bot.verify(req.rawBody, req.get('X-Line-Signature'))) {
        return res.sendStatus(400);
    }
    bot.parse(req.body);
    res.set('Content-Type', 'text/plain');
    res.status(200).end();
});

// アソビストアからスクレイピングしてくる関数
async function getWaitingTime(name) {
    const fetchResult = await cheerio.fetch('https://asobistore.jp/event-ticket/List');
    let replyMessage = "";
    console.log('sleepy!');
    // 一旦、tableを全部引っ張ってくる
    const object = fetchResult.$('table').each(function (index) 
    {
        const  table = fetchResult.$(this);
        console.log(index + ':' + table.text());
    });
    let tables = fetchResult.$('table').text();
    console.log(tables);
    replyMessage += tables;

    return replyMessage;
}

// 友達追加
bot.on('follow', (event) => {
    console.log('follow event');
});

// ブロック
bot.on('unfollow', (event) => {
    console.log('unfollow event');
});

//メッセージイベント
bot.on('message', async (event) => {
    console.log('message event');
    if(event.message.type !== 'text') {
        return;
    }
    let replyMessage;
    try 
    {
        if(event.message.text.indexOf('AS') !== -1) {
            replyMessage = await getWaitingTime("765AllStars");
        }else if(event.message.text.indexOf('デレ') !== -1){
            replyMessage = await getWaitingTime("CinderellaGirs");
        }else if(event.message.text.indexOf('ミリ') !== -1){
            replyMessage = await getWaitingTime("MillionStars");
        }else if(event.message.text.indexOf('シャニ') !== -1){
            replyMessage = await getWaitingTime("ShinyColors");
        }else if(event.message.text.indexOf('SideM') !== -1){
            replyMessage = await getWaitingTime("SideM");
        }else if(event.message.text.indexOf('指定なし') !== -1){
            replyMessage = await getWaitingTime("AllIM@S");
        }
        else {
            replyMessage = "先行申込情報を知りたいコンテンツを選んでください";
        }
    }catch(err)
    {
        console.log('an error occured!');
        console.log(err);
    }
    event.reply(replyMessage);
});



module.exports = router;