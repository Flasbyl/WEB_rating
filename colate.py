import os 

def append_files_to_txt(input_directories, output_file):
    """
    Reads the content of all files in the specified directories and appends
    the filename and content to a single text file.
    
    Args:
        input_directories (list of str): List of paths to the directories containing files.
        output_file (str): Path to the output text file.
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as outfile:
            for directory in input_directories:
                for filename in os.listdir(directory):
                    file_path = os.path.join(directory, filename)
                    
                    if os.path.isfile(file_path):  # Ensure it's a file
                        try:
                            with open(file_path, 'r', encoding='utf-8') as infile:
                                content = infile.read()
                                outfile.write(f"Filename: {filename}\n")
                                outfile.write("Content:\n")
                                outfile.write(content + "\n")
                                outfile.write("-" * 40 + "\n")  # Separator
                        except Exception as e:
                            print(f"Error reading {filename} in {directory}: {e}")
        print(f"Content appended to {output_file} successfully.")
    except Exception as e:
        print(f"Error writing to output file: {e}")

def append_js_files_to_txt(input_directories, output_file):
    """
    Reads the content of all .js files in the specified directories and appends
    the filename and content to a single text file.
    
    Args:
        input_directories (list of str): List of paths to the directories containing .js files.
        output_file (str): Path to the output text file.
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as outfile:
            for directory in input_directories:
                for filename in os.listdir(directory):
                    if filename.endswith('.js'):  # Only process .js files
                        file_path = os.path.join(directory, filename)
                        
                        if os.path.isfile(file_path):  # Ensure it's a file
                            try:
                                with open(file_path, 'r', encoding='utf-8') as infile:
                                    content = infile.read()
                                    outfile.write(f"Filename: {filename}\n")
                                    outfile.write("Content:\n")
                                    outfile.write(content + "\n")
                                    outfile.write("-" * 40 + "\n")  # Separator
                            except Exception as e:
                                print(f"Error reading {filename} in {directory}: {e}")
        print(f"Content of .js files appended to {output_file} successfully.")
    except Exception as e:
        print(f"Error writing to output file: {e}")

# Specify your input directories and output file paths
input_directories_pug = [
    r"C:\Users\flasb\OneDrive - Hochschule Luzern\WEB\PUG\views"
]
output_file_pug = "0_pug_project.txt"

js_files_directories = [
    r"C:\Users\flasb\OneDrive - Hochschule Luzern\WEB\PUG\public\scripts",
    r"C:\Users\flasb\OneDrive - Hochschule Luzern\WEB\PUG"
]
js_files_output = "0_js_files_output.txt"

# Run the functions
append_files_to_txt(input_directories_pug, output_file_pug)
append_js_files_to_txt(js_files_directories, js_files_output)
