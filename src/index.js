const parser = require('rss-parser');
const config = require('../config.json');
const Database = require('./database');
const sanitizeHtml = require('sanitize-html');

const db = new Database(config.published_database);

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.telegram.token, {polling: false});
const instantViewStart = 'https://t.me/iv?url=';
const instantViewEnd = '%2F&rhash=1406ed45adff04'; // '%2F&rhash=08ab6327085c24';


const sendUpdate = function (entry) {
    const content = sanitizeHtml(entry.content, {
        allowedTags: ['b', 'i', 'strong', 'em', 'pre', 'code', 'a'],
        allowedAttributes: {
            a: ['href'],
        },
    });

    bot.sendMessage(config.telegram.channel,
        "<b>" + entry.title + "</b>\n" +
        "<a href=\"" + instantViewStart + entry.link + instantViewEnd + "\">" + "Открыть статью" + "</a>\n" + content.replace(/\s+/g, ' ').trim(),
        {
            parse_mode: "HTML",
            disable_web_page_preview: false,
        },
    );
};

const fetchFeed = function () {
    parser.parseURL(config.source.feed, function (error, parsed) {
        console.log(parsed.feed.title);

        for (let i = parsed.feed.entries.length - 1; i >= 0; i--) {
            const entry = parsed.feed.entries[i];
            if (!db.isItemAlreadyParsed(entry.guid)) {
                sendUpdate(entry);
                db.addItem(entry.guid);

            } else {
                // already parsed
                console.log(entry.title);
            }
            console.log(entry.title);
            console.log("<b>" + entry.title + "</b>\n" +
                "<a href=\"" + instantViewStart + entry.link + instantViewEnd + "\">" + entry.link + "</a>\n");
        }

        db.writeDatabase();
    });
};

setInterval(fetchFeed, config.source.refresh_interval);
fetchFeed();

if (config.status_monitor_port !== null) {
    require('./monitor').start(config.status_monitor_port);
}
