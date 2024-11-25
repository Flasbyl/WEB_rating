import dotenv from 'dotenv';
dotenv.config();

import {
    supabase,
    addRating,
    fetchRatings,
    fetchProfessors,
    fetchModules,
    fetchDepartments,
    fetchSemesters,
    fetchProfModRelations,
    fetchModProfRelations,
    loginUser,
    registerUser,
    resetPassword,
    updateUserProfile,
    updatePassword,
    updatePreferences,
    fetchRatingHistory,
    deleteUserAccount,
    fetchUserPreferences,
    updateUserPreferences,
    fetchActivityLogs,
    logActivity
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
app.set('views', path.join(__dirname, 'views'));

// Middleware to serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public'))); // Ensure correct path to public directory
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Activity logging middleware
app.use(async (req, res, next) => {
    const user = req.session?.user;

    if (user) {
        const activityData = {
            user_id: user.id,
            username: user.username,
            timestamp: new Date().toISOString(),
            http_method: req.method,
            url: req.originalUrl,
            ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            user_agent: req.headers['user-agent'],
        };

        try {
            await logActivity(activityData);
            console.log(`[Activity Logged]: ${JSON.stringify(activityData)}`);
        } catch (err) {
            console.error('Failed to log activity:', err);
        }
    } else {
        console.log('No user session; skipping activity logging.');
    }

    next();
});

// route definitions
app.get('/profile', (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/login');
    }
    res.render('general', { user, activeTab: 'general' });
});

app.post('/profile/update', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('You must be logged in to update your profile.');
    }

    const { username, email, visibility } = req.body;
    try {
        const userId = req.session.user.id;
        const { error } = await supabase
            .from('users')
            .update({ username, email, visibility })
            .eq('id', userId);

        if (error) throw error;

        // Update the session with new user data
        req.session.user = { ...req.session.user, username, email, visibility };
        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).send('Error updating profile');
    }
});

app.get('/profile/password', (req, res) => {
    res.render('password', { activeTab: 'password' });
});

app.post('/profile/password', async (req, res) => {
    const { current_password, new_password } = req.body;
    try {
        await updatePassword(req.session.user.id, current_password, new_password);
        res.redirect('/profile/password');
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).send('Error updating password');
    }
});

app.get('/profile/preferences', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/login');
    }

    const preferences = await fetchUserPreferences(user.id);
    res.render('preferences', { user, activeTab: 'preferences', preferences });
});

app.post('/profile/preferences', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/login');
    }

    const { dark_mode, email_notifications } = req.body;
    const preferences = {
        dark_mode: !!dark_mode,
        email_notifications: !!email_notifications
    };

    await updateUserPreferences(user.id, preferences);
    res.redirect('/profile/preferences');
});

app.get('/profile/history', async (req, res) => {
    try {
        const ratings = await fetchRatingHistory(req.session.user.id);
        res.render('history', { ratings, activeTab: 'history' });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).send('Error fetching history');
    }
});

app.get('/profile/privacy', async (req, res) => {
    console.log('Request received for /profile/privacy');
    if (!req.session.user) {
        console.log('No session user found. Redirecting to login.');
        return res.redirect('/login');
    }

    const userId = req.session.user.id;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('visibility')
            .eq('id', userId)
            .single();

        if (error) throw error;

        console.log('Fetched user visibility:', user.visibility);
        res.render('privacy', { user: { ...req.session.user, visibility: user.visibility }, activeTab: 'privacy' });
    } catch (err) {
        console.error('Error loading privacy settings:', err);
        res.status(500).send('Error loading privacy settings');
    }
});

app.post('/profile/privacy/update', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('You must be logged in to update your profile.');
    }

    const { visibility } = req.body;
    try {
        const userId = req.session.user.id;
        const { error } = await supabase
            .from('users')
            .update({ visibility })
            .eq('id', userId);

        if (error) throw error;

        // Update the session with new user data
        req.session.user = { ...req.session.user, visibility };
        res.redirect('/profile/privacy');
    } catch (err) {
        console.error('Error updating privacy:', err);
        res.status(500).send('Error updating privacy');
    }
});

app.post('/profile/delete', async (req, res) => {
    try {
        await deleteUserAccount(req.session.user.id);
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).send('Error deleting account');
    }
});

app.get('/profile/activity', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/login');
    }

    const activityLogs = await fetchActivityLogs(user.id);
    res.render('activity', { user, activeTab: 'activity', activityLogs });
});

// Redirect root URL to /home
app.get('/', (req, res) => {
    res.redirect('/home');
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

app.get('/resetpassword', (req, res) => {
    res.render('resetpassword');
});

app.post('/resetpassword', async (req, res) => {
    const { email, username } = req.body;

    try {
        if (!email && !username) {
            return res.status(400).send('Please provide a username or email.');
        }

        // Attempt to reset password based on either username or email
        const identifier = email || username;
        const result = await resetPassword(identifier);

        if (!result) {
            return res.status(404).send('User not found.');
        }

        res.send(`Password reset instructions sent to ${email || username}.`);
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).send('Error resetting password.');
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
        res.redirect('/home');
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).send('Invalid credentials');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/home');
});

app.get('/home', async (req, res) => {
    try {
        const { profIdValue, moduleIdValue } = req.query;

        // Fetch initial dropdown options
        const firstDropdown = await fetchProfessors('*');
        const secondDropdown = profIdValue ? await fetchModules('*') : [];

        const originalOptions = {
            firstDropdown,
            secondDropdown,
        };

        // Grade and workload options
        const gradeOptions = {
            3.5: 'Failed / F',
            4.0: 'E',
            4.5: 'D',
            5.0: 'C',
            5.5: 'B',
            6.0: 'A',
        };

        const workloadOptions = {
            1: 'Walk in the Park',
            2: 'Manageable',
            3: 'Moderate Effort',
            4: 'Challenging',
            5: 'Pain and Suffering',
        };

        res.render('home', {
            user: req.session.user,
            selectedProfIdValue: profIdValue || '',
            selectedModuleIdValue: moduleIdValue || '',
            originalOptions,
            gradeOptions,
            workloadOptions,
        });
    } catch (error) {
        console.error('Error rendering home:', error);
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

app.post('/submit-rating', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Please login to submit ratings');
    }

    const { comment, rating, prof_id_hidden, sem_id_hidden, module_id_hidden, grade, workload } = req.body;

    try {
        const user_id = req.session.user.id;

        // Save rating along with grade and workload
        await addRating(comment, rating, prof_id_hidden, sem_id_hidden, module_id_hidden, user_id, grade, workload);

        // Redirect back to the home page with the selected dropdowns
        res.redirect(`/home?profIdValue=${prof_id_hidden}&moduleIdValue=${module_id_hidden}`);
    } catch (err) {
        console.error('Error submitting rating:', err);
        res.status(500).send('Error submitting rating');
    }
});

app.get('/comments', async (req, res) => {
    const { prof_id_hidden, module_id_hidden } = req.query;

    if (!prof_id_hidden || !module_id_hidden) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        const { data, error } = await supabase
            .from('ratings')
            .select('comment, rating, grade, workload, created_at')
            .eq('prof_id', prof_id_hidden)
            .eq('module_id', module_id_hidden);

        if (error) {
            console.error('Error fetching comments:', error);
            return res.status(500).json({ error: 'Failed to fetch comments.' });
        }

        res.json(data);
    } catch (err) {
        console.error('Unexpected error fetching comments:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
