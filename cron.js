const cron = require('node-cron');
const moment = require('moment');
const Run = require('./models/Run');
const Orders = require('./models/Orders');
console.log('initalized');
cron.schedule('0 0 * * *', async () => {
    try {
        const runs = await Run.find({
            date: { $lt: moment(new Date()).toDate() },
            status: { $lte: 1 }
        })
        if (!runs?.length) return;
        const ordersIDs = []
        const ids = runs.map(run => {
            ordersIDs.push(...run.orders)
            return run._id
        })
        const updateRuns = Run.updateMany({
            _id: { $in: ids }
        }, { $set: { status: 2 } })
        const updateOrders = Orders.updateMany({
            _id: { $in: ordersIDs }
        }, { $set: { status: 2 } })
        await Promise.all([updateRuns, updateOrders])
    } catch { }
});