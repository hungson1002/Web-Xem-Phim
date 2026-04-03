import express from 'express';
import Category from '../models/Category.model.js';

const router = express.Router();

router.get('/', async function(req, res) {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: categories });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', async function(req, res) {
    try {
        const { name, slug, _id } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ success: false, message: 'Name and Slug are required' });
        }

        const newCategory = new Category({
            name,
            slug,
            _id: _id || undefined
        });

        const savedCategory = await newCategory.save();
        return res.status(201).json({ success: true, data: savedCategory });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Category with this slug or ID already exists' });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', async function(req, res) {
    try {
        const { id } = req.params;
        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
