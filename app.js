import dotenv from 'dotenv';
dotenv.config();

import {
    addRating,
    fetchRatings,
    fetchProfessors,
    fetchModules,
    fetchDepartments,
    fetchProfModRelations,
    fetchModProfRelations,
    loginUser,
    registerUser,
    fetchSemesters
} from './db.js';

import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path'; // Ensure path is imported

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // Ensure correct path to views directory

// Middleware to serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public'))); // Ensure correct path to public directory
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Redirect root URL to /layout
app.get('/', (req, res) => {
    res.redirect('/layout');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        await registerUser(username, email, password);
        res.send('User registered successfully');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
});

app.get('/login', async (req, res) => {
    res.render('login', { user: req.session.user });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await loginUser(username, password);
        req.session.user = user;
        res.redirect('/layout');
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).send('Invalid credentials');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/layout');
});

app.get('/layout', async (req, res) => {
    try {
        res.render('layout', { user: req.session.user });
    } catch (error) {
        console.error('Error rendering layout:', error);
        res.status(500).send('Internal Server Error');
    }
});

// get professors
app.get('/professors', async (req, res) => {
    try {
        const professors = await fetchProfessors('*');
        res.json(professors);
    } catch (err) {
        console.error('Failed to fetch professors:', err);
        res.status(500).send('Failed to load page');
    }
});

// get modules
app.get('/modules', async (req, res) => {
    try {
        const modules = await fetchModules('*');
        res.json(modules);
    } catch (err) {
        console.error('Failed to fetch modules:', err);
        res.status(500).send('Failed to load page');
    }
});

// get departments
app.get('/departments', async (req, res) => {
    try {
        const departments = await fetchDepartments();
        res.json(departments);
    } catch (err) {
        console.error('Failed to fetch departments:', err);
        res.status(500).send('Failed to load page');
    }
});

// get Professor Module Relations
app.get('/relations/professor/:profName', async (req, res) => {
    try {
        const relationsPM = await fetchModProfRelations(req.params.profName);
        res.json(relationsPM);
    } catch (err) {
        console.error('Failed to fetch relations:', err);
        res.status(500).send('Failed to load page');
    }
});

// get Module Professor Relations
app.get('/relations/module/:moduleName', async (req, res) => {
    try {
        const relationsMP = await fetchProfModRelations(req.params.moduleName);
        res.json(relationsMP);
    } catch (err) {
        console.error('Failed to fetch relations:', err);
        res.status(500).send('Failed to load page');
    }
});

// get data for graphs
app.get('/chart', async (req, res) => {
    const { category, firstId, secondId } = req.query;
    try {
        const { data: rawData, profIdValue, moduleIdValue } = await fetchRatings(category, firstId, secondId);
        console.log('line 143 app.js: ==========chart===========');
        console.log('line 144 app.js: rawData:', rawData);
        console.log('line 145 app.js: profIdValue:', profIdValue, 'moduleIdValue:', moduleIdValue);
        
        const averages = {};
        const scatterData = [];
        const curveData = [];

        rawData.forEach(rating => {
            scatterData.push({ x: rating.sem_id, y: rating.rating });
            if (!averages[rating.sem_id]) {
                averages[rating.sem_id] = { sum: rating.rating, count: 1 };
            } else {
                averages[rating.sem_id].sum += rating.rating;
                averages[rating.sem_id].count++;
            }
        });

        for (let sem_id in averages) {
            curveData.push({
                x: sem_id,
                y: averages[sem_id].sum / averages[sem_id].count
            });
        }

        const ratingData = { scatter: scatterData, curve: curveData };
        res.json({ ratingData, profIdValue, moduleIdValue });
        console.log('line 168 app.js: ratingData:', ratingData);
        console.log('line 169 app.js: scatterData:', scatterData);
        console.log('line 170 app.js: curveData:', curveData);
    } catch (err) {
        console.error('Failed to fetch ratings:', err);
        res.status(500).send('Failed to load page');
    }
});

// get semesters
app.get('/semester', async (req, res) => {
    try {
        const semesterData = await fetchSemesters();
        console.log('line 181 app.js: semesterData', semesterData);
        res.json(semesterData);
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).send('Error fetching semesters');
    }
});

// post new rating to sql db
app.post('/submit-rating', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Please login to submit ratings');
    }

    const { comment, rating, prof_id_hidden, sem_id_hidden, module_id_hidden } = req.body;
    console.log('body app.js line 199:', req.body)
    try {
        await addRating(comment, rating, prof_id_hidden, sem_id_hidden, module_id_hidden);
        res.redirect('/layout');
    } catch (err) {
        res.status(500).send('Error submitting rating');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
