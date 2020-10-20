const fs = require('fs').promises;
const Twitter = require('twitter-lite');

require('dotenv').config();

const config = {
    MAX_TWEETS: 10000,
    FROM_DATE: new Date('1900-01-01'),
    TO_DATE: new Date('2014-01-01'),
};

(async function () {

    let archiveText = await fs.readFile('./tweet.js', 'utf8');
    archiveText = archiveText.replace(/^window.YTD.tweet.part0 = /g, '');
    let archiveData = JSON.parse(archiveText);

    let deletedData = [];
    try {
        let deletedText = await fs.readFile('./deleted-tweets.json', 'utf8');
        deletedData = JSON.parse(deletedText);
    } catch (e) { }

    let client = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    });

    let deletedCount = 0;

    for (let { tweet } of archiveData) {

        if (!deletedData.includes(tweet.id)) {

            let tweetCreationDate = new Date(tweet.created_at);

            if (tweetCreationDate >= config.FROM_DATE && tweetCreationDate <= config.TO_DATE) {

                await client.post(`statuses/destroy/${tweet.id}`);

                console.log(`Deleted ${tweet.id} - ${tweet.created_at} - ${tweet.full_text}`);

                deletedData.push(tweet.id);
                await fs.writeFile('./deleted-tweets.json', JSON.stringify(deletedData));

                deletedCount++;

                if (deletedCount >= config.MAX_TWEETS) {
                    break;
                }

            }

        }

    }

    console.log(`Deleted ${deletedCount} tweets`);

})();

