import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import {
    createClient
} from '@supabase/supabase-js';

const supabaseUrl = 'https://jqnesxzpfsfxzqnudtig.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchProfessors(columns = '*') {
    try {
        const { data, error } = await supabase
            .from('professors')
            .select(columns);

        if (error) {
            console.error('Error fetching professors:', error);
            return []; // Return an empty array on error
        }

        if (!data || data.length === 0) {
            console.warn('No professors found.');
            return []; // Return an empty array if no data
        }

        console.log(`line 23 db.js: Fetched ${data.length} professors.`);
        return data;
    } catch (error) {
        console.error('Unexpected error fetching professors:', error);
        return []; // Return an empty array on unexpected error
    }
}

async function fetchModules(columns = '*') {
    try {
        const { data, error } = await supabase
            .from('modules')
            .select(columns);

        if (error) {
            console.error('Error fetching modules:', error);
            return []; // Return an empty array on error
        }

        if (!data || data.length === 0) {
            console.warn('No modules found.');
            return []; // Return an empty array if no data
        }

        console.log(`line 41 db.js: Fetched ${data.length} modules.`);
        return data;
    } catch (error) {
        console.error('Unexpected error fetching modules:', error);
        return []; // Return an empty array on unexpected error
    }
}

async function fetchDepartments() {
    try {
        const { data, error } = await supabase
            .from('departments')
            .select('*');

        if (error) {
            console.error('Error fetching departments:', error);
            return [];
        }
        console.log('line 59 db.js: Fetched departments:', data[0], '...');
        return data;
    } catch (error) {
        console.error('Unexpected error fetching departments:', error);
        return [];
    }
}

async function fetchSemesters() {
    try {
        const { data, error } = await supabase
        .from('semester')
        .select('*');

        if (error) {
            console.error('Error fetching semesters:', error);
            return [];
        }
        console.log('line 77 db.js: Fetched semesters:', data[0], '...');
        return data;
    } catch (error) {
        console.error('Unexpected error fetching semesters:', error);
        return [];
    }
}

async function fetchProfModRelations(profName) {
    try {
        const { data: professorData, error: professorError } = await supabase
            .from('professors')
            .select('prof_id')
            .eq('name', profName);

        if (professorError) {
            console.error('Error fetching professor data:', professorError);
            return [];
        }

        const professorIds = professorData.map(professor => professor.prof_id);

        const { data: relationsData, error: relationsError } = await supabase
            .from('professors_modules')
            .select('module_id')
            .in('prof_id', professorIds);

        if (relationsError) {
            console.error('Error fetching relations data:', relationsError);
            return [];
        }

        const moduleIds = relationsData.map(relation => relation.module_id);

        const { data: modulesData, error: modulesError } = await supabase
            .from('modules')
            .select('name, module_id')
            .in('module_id', moduleIds);

        if (modulesError) {
            console.error('Error fetching module data:', modulesError);
            return [];
        }

        return modulesData;
    } catch (error) {
        console.error('Unexpected error fetching relations:', error);
        return [];
    }
}

async function fetchModProfRelations(moduleName) {
    try {
        const { data: moduleData, error: moduleError } = await supabase
            .from('modules')
            .select('module_id')
            .eq('name', moduleName);

        if (moduleError) {
            console.error('Error fetching module data:', moduleError);
            return [];
        }

        const moduleIds = moduleData.map(module => module.module_id);

        const { data: relationsData, error: relationsError } = await supabase
            .from('professors_modules')
            .select('prof_id')
            .in('module_id', moduleIds);

        if (relationsError) {
            console.error('Error fetching relations data:', relationsError);
            return [];
        }

        const professorIds = relationsData.map(relation => relation.prof_id);

        const { data: professorsData, error: professorsError } = await supabase
            .from('professors')
            .select('name, prof_id')
            .in('prof_id', professorIds);

        if (professorsError) {
            console.error('Error fetching professor data:', professorsError);
            return [];
        }

        return professorsData;
    } catch (error) {
        console.error('Unexpected error fetching relations:', error);
        return [];
    }
}

async function fetchRatings(category, firstId, secondId) {

    console.log('line 173 db.js: 1. category passed:', category, 'profId passed:', firstId, 'moduleId passed:', secondId);
    
    let profId, moduleId;
    if (category === 'professor') {
        profId = firstId;
        moduleId = secondId;
    } else {
        profId = secondId;
        moduleId = firstId;
    }

    console.log('line 184 db.js: 2. category passed:', category, 'profId passed:', profId, 'moduleId passed:', moduleId);

    // Fetch the actual IDs from the professors and modules tables
    let profIdValue, moduleIdValue;
    
    if (profId) {
        const profData = await fetchProfessors();
        const prof = profData.find(p => p.name === profId);
        profIdValue = prof ? prof.prof_id : null;
    }

    if (moduleId) {
        const modData = await fetchModules();
        const module = modData.find(m => m.name === moduleId);
        moduleIdValue = module ? module.module_id : null;
    }

    if (!profIdValue || !moduleIdValue) {
        console.error('Invalid professor or module name provided');
        return [];
    }

    console.log('line 206 db.js: 3. Using profIdValue:', profIdValue, 'and moduleIdValue:', moduleIdValue);
    try {
        const { data, error } = await supabase
            .from('ratings')
            .select('*')
            .eq('prof_id', profIdValue)
            .eq('module_id', moduleIdValue);

        if (error) {
            console.error('Error fetching ratings:', error);
            return [];
        }
        console.log('line 218 db.js: Fetched ratings:', data[0], '...');
        return { data, profIdValue, moduleIdValue };  // Return as an object
    } catch (error) {
        console.error('Unexpected error fetching ratings:', error);
        return [];
    }
}

async function addRating(comment, rating, prof_id, sem_id, module_id, user_id) {
    try {
        const { data, error } = await supabase.from('ratings').insert([{
            comment,
            rating,
            prof_id,
            sem_id,
            module_id,
            user_id,
        }]);

        if (error) {
            console.error('Error inserting rating:', error);
            throw error;
        }

        console.log('Rating successfully added:', data);
        return data;
    } catch (error) {
        console.error('Unexpected error adding rating:', error);
        throw error;
    }
}


async function loginUser(username, password) {
    const { data: user, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error || !user) {
      throw new Error('Invalid credentials');
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

async function registerUser(username, email, password) {
    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert([{ username, email, password, password_hash: passwordHash }]);
    if (error) {
        console.error('Error registering user:', error);
        throw error;
    }
    return data;
}

async function resetPassword(identifier) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email')
            .or(`username.eq.${identifier},email.eq.${identifier}`)
            .single();

        if (error || !user) {
            console.error('User not found for reset:', error);
            return null;
        }

        const tempPassword = Math.random().toString(36).substring(2, 8); // e.g., "temp123"
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating password:', updateError);
            return null;
        }

        await sendPasswordResetEmail(user.email, tempPassword);

        console.log(`Temporary password sent to ${user.email}`);
        return { email: user.email, tempPassword };
    } catch (error) {
        console.error('Error during password reset logic:', error);
        throw error;
    }
}

async function sendPasswordResetEmail(email, resetLink) {
    // Replace this with actual email service logic
    console.log(`Sending password reset email to ${email} with link: ${resetLink}`);
}

async function updateUserProfile(userId, username, email, visibility) {
    const { error } = await supabase
        .from('users')
        .update({ username, email, visibility })
        .eq('id', userId);
    if (error) throw error;
}

async function updatePassword(userId, currentPassword, newPassword) {
    const { data: user, error } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

    if (error || !user) throw new Error('User not found');
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) throw new Error('Invalid current password');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', userId);

    if (updateError) throw updateError;
}

async function updatePreferences(userId, preferences) {
    const { error } = await supabase
        .from('users')
        .update({ preferences })
        .eq('id', userId);
    if (error) throw error;
}

async function fetchRatingHistory(userId) {
    try {
        const { data, error } = await supabase
            .from('ratings')
            .select('id, comment, rating, prof_id, sem_id, module_id, created_at')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching rating history:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Unexpected error fetching rating history:', error);
        throw error;
    }
}


async function deleteUserAccount(userId) {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
    if (error) throw error;
}

async function fetchUserPreferences(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user preferences:', error);
            throw error;
        }
        return data.preferences || {};
    } catch (error) {
        console.error('Unexpected error fetching user preferences:', error);
        return {};
    }
}

async function updateUserPreferences(userId, preferences) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ preferences })
            .eq('id', userId);

        if (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    } catch (error) {
        console.error('Unexpected error updating user preferences:', error);
    }
}

async function fetchActivityLogs(userId) {
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('visibility');

        if (error) {
            console.error('Error fetching privacy:', error);
            return [];
        }
        return data;
    } catch (error) {
        console.error('Unexpected error fetching privacy:', error);
        return [];
    }
}

export async function logActivity(activityData) {
    const { user_id, action } = activityData;

    try {
        const { data, error } = await supabase
            .from('activity')
            .insert([
                {
                    user_id,
                    action, // Simplify to include only the relevant columns
                    created_at: new Date().toISOString() // Optional: Supabase can auto-generate this
                }
            ]);

        if (error) {
            console.error('Error logging activity to database:', error);
            throw error;
        }

        return data;
    } catch (err) {
        console.error('Unexpected error during activity logging:', err);
        throw err;
    }
}


async function fetchPrivacy(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching activity logs:', error);
            return [];
        }
        return data;
    } catch (error) {
        console.error('Unexpected error fetching activity logs:', error);
        return [];
    }
}

export {
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
    fetchPrivacy
};
