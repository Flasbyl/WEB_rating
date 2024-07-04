import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import {
    createClient
} from '@supabase/supabase-js';

const supabaseUrl = 'https://jqnesxzpfsfxzqnudtig.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchProfessors(profName) {
    try {
        const { data, error } = await supabase
            .from('professors')
            .select(profName);

        if (error) {
            console.error('Error fetching professors:', error);
            return [];
        }
        console.log('line 23 db.js: Fetched professors:', data[0], '...');
        return data;
    } catch (error) {
        console.error('Unexpected error fetching professors:', error);
        return [];
    }
}

async function fetchModules(moduleName) {
    try {
        const { data, error } = await supabase
            .from('modules')
            .select(moduleName);

        if (error) {
            console.error('Error fetching modules:', error);
            return [];
        }
        console.log('line 41 db.js: Fetched modules:', data[0], '...');
        return data;
    } catch (error) {
        console.error('Unexpected error fetching modules:', error);
        return [];
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


async function addRating(comment, rating, prof_id, sem_id, module_id) {
    console.log('line 228: comment:', comment)
    console.log('line 228: rating:', rating)
    console.log('line 228: prof hidden:', prof_id)
    console.log('line 228: sem hidden:', sem_id)
    console.log('line 228: mod hidden:', module_id)

    const { data, error } = await supabase.from('ratings').insert([{ comment, rating, prof_id, sem_id, module_id}]);
    console.log('line 229 db.js:', comment, rating, prof_id, sem_id, module_id)
    if (error) {
        console.error('Error inserting rating:', error);
        throw error;
    }
    return data;
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


export {
    addRating,
    fetchRatings,
    fetchProfessors,
    fetchModules,
    fetchDepartments,
    fetchSemesters,
    fetchProfModRelations,
    fetchModProfRelations,
    loginUser,
    registerUser
};
