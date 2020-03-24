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

    fetchResult.$('table').each(function (index) 
    {
        const  table = fetchResult.$(this);
        if (table.text().includes(name))
        {
            table.find('tr').each(function(index)
            {
                console.log(fetchResult.$(this).text());
                replyMessage += fetchResult.$(this).text();
            });
        }

    });
    if (replyMessage.length === 0)
    {
        replyMessage += "先行申込情報が見つかりませんでした。シリーズの指定なしで試してみてください。"
    }

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
            replyMessage = await getWaitingTime("CINDERELLA GIRLS");
        }else if(event.message.text.indexOf('ミリ') !== -1){
            replyMessage = await getWaitingTime("MillionStars");
        }else if(event.message.text.indexOf('シャニ') !== -1){
            replyMessage = await getWaitingTime("SHINY COLORS");
        }else if(event.message.text.indexOf('SideM') !== -1){
            replyMessage = await getWaitingTime("SideM");
        }else if(event.message.text.indexOf('指定なし') !== -1){
            replyMessage = await getWaitingTime("THE IDOLM@STER");
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