import express from 'express';
import Movie from '../models/Movie.model.js';

const router = express.Router();

const getSortObject = (sortBy) => {
    switch (sortBy) {
        case 'year-desc':
            return { year: -1 };
        case 'year-asc':
            return { year: 1 };
        case 'rating-desc':
            return { 'tmdb.vote_average': -1 };
        case 'rating-asc':
            return { 'tmdb.vote_average': 1 };
        default:
            return { 'modified.time': -1 };
    }
};

router.get('/', async function(req, res) {
    try {
        const { page = 1, limit = 20, search, sort, type } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { origin_name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }

        if (type) {
            query.type = type;
        }

        const sortObject = getSortObject(sort);
        const movies = await Movie.find(query)
            .sort(sortObject)
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Movie.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: movies,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/category/:slug', async function(req, res) {
    try {
        const { page = 1, limit = 20, sort } = req.query;
        const { slug } = req.params;
        const skip = (page - 1) * limit;

        const query = { 'category.slug': slug };

        const sortObject = getSortObject(sort);
        const movies = await Movie.find(query)
            .sort(sortObject)
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Movie.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: movies,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/country/:slug', async function(req, res) {
    try {
        const { page = 1, limit = 20, sort } = req.query;
        const { slug } = req.params;
        const skip = (page - 1) * limit;

        const query = { 'country.slug': slug };

        const sortObject = getSortObject(sort);
        const movies = await Movie.find(query)
            .sort(sortObject)
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Movie.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: movies,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/year/:year', async function(req, res) {
    try {
        const { page = 1, limit = 20, sort } = req.query;
        const { year } = req.params;
        const skip = (page - 1) * limit;

        const query = { year: parseInt(year) };

        const sortObject = getSortObject(sort);
        const movies = await Movie.find(query)
            .sort(sortObject)
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        const total = await Movie.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: movies,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/limit/:limit', async function(req, res) {
    try {
        const { limit } = req.params;
        const movies = await Movie.find({})
            .sort({ 'modified.time': -1 })
            .limit(parseInt(limit));

        return res.status(200).json({ success: true, data: movies });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/:slug', async function(req, res) {
    try {
        const { slug } = req.params;
        const movie = await Movie.findOne({ slug });

        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        return res.status(200).json({ success: true, data: movie });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', async function(req, res) {
    try {
        const movieData = req.body;

        const existingMovie = await Movie.findOne({ slug: movieData.slug });
        if (existingMovie) {
            return res.status(400).json({ success: false, message: 'Movie with this slug already exists' });
        }

        const newMovie = new Movie(movieData);
        const savedMovie = await newMovie.save();

        return res.status(201).json({ success: true, data: savedMovie });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id', async function(req, res) {
    try {
        const { id } = req.params;
        const updatedMovie = await Movie.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!updatedMovie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        return res.status(200).json({ success: true, data: updatedMovie });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', async function(req, res) {
    try {
        const { id } = req.params;
        const deletedMovie = await Movie.findByIdAndDelete(id);

        if (!deletedMovie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        return res.status(200).json({ success: true, message: 'Movie deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
