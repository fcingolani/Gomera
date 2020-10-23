const fs = require('fs').promises;
const Twitter = require('twitter-lite');

require('dotenv').config();

const config = {
    MAX_TWEETS: 10000,
    FROM_DATE: new Date('1900-01-01'),
    TO_DATE: new Date('2016-01-01'),
};

(async function () {

    let archiveText = await fs.readFile('./tweet.js', 'utf8');
    archiveText = archiveText.replace(/^window.YTD.tweet.part0 = /g, '');
    let archiveData = JSON.parse(archiveText);

    let processedData = [];
    try {
        let processedText = await fs.readFile('./processed-tweets.json', 'utf8');
        processedData = JSON.parse(processedText);
    } catch (e) { }

    let client = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    });

    let processedCount = 0;

    for (let { tweet } of archiveData) {

        if (!processedData.includes(tweet.id)) {

            let tweetCreationDate = new Date(tweet.created_at);

            if (tweetCreationDate >= config.FROM_DATE && tweetCreationDate <= config.TO_DATE) {

                let liveTweet = await client.get(`statuses/show/${tweet.id}`);

                if (liveTweet.favorited || liveTweet.retweeted) {

                    console.log(`Skipped ${tweet.id} - ${tweet.created_at}\n${tweet.full_text}\n\n`);

                } else {

                    await client.post(`statuses/destroy/${tweet.id}`);
                    console.log(`Deleted ${tweet.id} - ${tweet.created_at}\n${tweet.full_text}\n\n`);

                }

                processedData.push(tweet.id);
                await fs.writeFile('./processed-tweets.json', JSON.stringify(processedData));

                processedCount++;

                if (processedCount >= config.MAX_TWEETS) {
                    break;
                }



            }

        }

    }

    console.log(`Processed ${processedCount} tweets`);

})();

