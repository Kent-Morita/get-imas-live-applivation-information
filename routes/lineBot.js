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
async function getTicketInformation(name) {
    const fetchResult = await cheerio.fetch('https://asobistore.jp/event-ticket/List');
    let replyMessages = [];

    // fetchした内容のうち、'table'の中身を一個ずつ取り出してreplyMessageに追加する
    fetchResult.$('table').each(function (index) 
    {
        let replyMessage = '';
        const  table = fetchResult.$(this);
        
        // 引数が含まれていなかったら飛ばす
        if (table.text().includes(name))
        {
            table.find('tr').each(function(index)
            {
                const tr = fetchResult.$(this);
                const th = tr.find('th');
                const td = tr.find('td');
                
                // 表示したいtrだけ表示する（
                if (th.text().includes('公演名')　|| th.text().includes('公演日時') 
                || th.text().includes('チケット情報'))
                {
                    replyMessage += ` ■${th.text()} : ${td.text()} \n`
                    replyMessage += '\n';

                }
                
            });
            replyMessages.push(replyMessage);
            console.log(replyMessages.length);
        }

    });
    if (replyMessages.length === 0)
    {
        replyMessages.push("先行申込情報が見つかりませんでした。シリーズの指定なしで試してみてください。");
    }

    return replyMessages;
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
    let replyMessages = [];
    try 
    {
        if(event.message.text.indexOf('AS') !== -1) {
            replyMessages = await getTicketInformation("765AllStars");
        }else if(event.message.text.indexOf('デレ') !== -1){
            replyMessages = await getTicketInformation("CINDERELLA GIRLS");
        }else if(event.message.text.indexOf('ミリ') !== -1){
            replyMessages = await getTicketInformation("MILLION LIVE");
        }else if(event.message.text.indexOf('シャニ') !== -1){
            replyMessages = await getTicketInformation("SHINY COLORS");
        }else if(event.message.text.indexOf('SideM') !== -1){
            replyMessages = await getTicketInformation("SideM");
        }else if(event.message.text.indexOf('指定なし') !== -1){
            replyMessages = await getTicketInformation("THE IDOLM@STER");
        }
        else {
            replyMessages = ["先行申込情報を知りたいコンテンツを選んでください"];
        }
    }catch(err)
    {
        console.log('an error occured!');
        console.log(err);
    }

    event.reply(replyMessages);
});



module.exports = router;