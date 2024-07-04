import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const supabaseUrl = 'https://jqnesxzpfsfxzqnudtig.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function hashPasswords() {
  try {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log('Fetched users:', users);

    for (const user of users) {
      // Check if the password_hash is empty or already hashed
      if (!user.password_hash || !user.password_hash.startsWith('$2b$')) {
        const passwordToHash = user.password || user.password_hash;
        const hashedPassword = await bcrypt.hash(passwordToHash, 10);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ password_hash: hashedPassword })
          .eq('id', user.id);
          
        if (updateError) {
          console.error(`Error updating user ${user.id}:`, updateError);
        } else {
          console.log(`User ${user.id} password updated.`);
        }
      } else {
        console.log(`User ${user.id} password is already hashed.`);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

hashPasswords();
