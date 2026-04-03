import express from 'express';
import Country from '../models/Country.model.js';

const router = express.Router();

router.get('/', async function(req, res) {
    try {
        const countries = await Country.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: countries });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', async function(req, res) {
    try {
        const { id, name, slug } = req.body;

        if (!name || !slug || !id) {
            return res.status(400).json({ success: false, message: 'ID, Name, and Slug are required' });
        }

        const newCountry = new Country({
            id,
            name,
            slug
        });

        const savedCountry = await newCountry.save();
        return res.status(201).json({ success: true, data: savedCountry });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Country with this ID or Slug already exists' });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', async function(req, res) {
    try {
        const { id } = req.params;
        const deletedCountry = await Country.findOneAndDelete({ id: id });

        if (!deletedCountry) {
            return res.status(404).json({ success: false, message: 'Country not found' });
        }

        return res.status(200).json({ success: true, message: 'Country deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
