const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost/shop_inventory', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Models
const Item = mongoose.model('Item', new mongoose.Schema({
    name: String,
    price: Number,
    quantity: Number,
}));

const BillItem = mongoose.model('BillItem', new mongoose.Schema({
    itemId: mongoose.Schema.Types.ObjectId,
    quantity: Number,
    price: Number,
}));

const Bill = mongoose.model('Bill', new mongoose.Schema({
    items: [BillItem.schema],
    totalAmount: Number,
    date: { type: Date, default: Date.now },
}));

// Routes
// Inventory Endpoints
app.post('/api/items', async (req, res) => {
    const item = new Item(req.body);
    await item.save();
    res.status(201).send(item);
});

app.get('/api/items', async (req, res) => {
    const items = await Item.find();
    res.send(items);
});

app.get('/api/items/:id', async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send('Item not found');
    res.send(item);
});

app.put('/api/items/:id', async (req, res) => {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).send('Item not found');
    res.send(item);
});

app.delete('/api/items/:id', async (req, res) => {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).send('Item not found');
    res.send(item);
});

// Bill Endpoints
app.post('/api/bills', async (req, res) => {
    const billItems = req.body.items;
    let totalAmount = 0;

    for (const billItem of billItems) {
        const item = await Item.findById(billItem.itemId);
        if (!item || item.quantity < billItem.quantity) {
            return res.status(400).send('Invalid item or insufficient stock');
        }

        item.quantity -= billItem.quantity;
        await item.save();

        billItem.price = item.price;
        totalAmount += item.price * billItem.quantity;
    }

    const bill = new Bill({
        items: billItems,
        totalAmount,
    });

    await bill.save();
    res.status(201).send(bill);
});

app.get('/api/bills', async (req, res) => {
    const bills = await Bill.find();
    res.send(bills);
});

app.get('/api/bills/:id', async (req, res) => {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).send('Bill not found');
    res.send(bill);
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});