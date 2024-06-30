
import time
import glob
import json
import os

def maintain():

    # Find all the occurences of the file "maintain.json" in the project. Use the cwd and go down recursively.
    # Make the paths absolute.
    files = glob.glob('**/maintain.json', recursive=True)
    files = [os.path.abspath(file) for file in files]
    print(f"Found {len(files)} maintain.json files.")

    # Create the state.
    state = {
    }
    for file in files:
        state[file] = json.load(open(file, 'r'))

        # Make the paths of the output files absolute.
        for output_file in state[file]["outputfiles"]:
            # Update the path of the output file.
            output_file["path"] = os.path.join(os.path.dirname(file), output_file["path"])

            # For each input file, update the path to make it absolute, make sure it exists and store the last modified time.
            # Make sure that .. and . and ~ are resolved.
            for input_file in output_file["inputfiles"]:
                input_file_path = os.path.join(os.path.dirname(file), input_file["path"])
                input_file_path = os.path.abspath(os.path.expanduser(input_file_path))
                input_file["path"] = input_file_path
                if not os.path.exists(input_file["path"]):
                    raise FileNotFoundError(f"Input file {input_file['path']} does not exist.")
                input_file["last_modified"] = os.path.getmtime(input_file["path"])

    # Start the main loop.
    while True:

        # For each output file, check if any of the input files have been modified.
        # If so, merge all the input files into the output file.
        for file in files:

            # This is an individual maintain.json file.
            for output_file in state[file]["outputfiles"]:
                output_file_path = output_file["path"]

                # Check if any of the input files have been modified.
                modified = False
                for input_file in output_file["inputfiles"]:
                    input_file_path = input_file["path"]
                    input_file_last_modified = os.path.getmtime(input_file_path)
                    if input_file_last_modified > input_file["last_modified"]:
                        modified = True
                        input_file["last_modified"] = input_file_last_modified
                        break

                # If any of the input files have been modified, merge them into the output file.
                if modified:
                    print(f"Input files for {output_file_path} have been modified. Merging...")
                    with open(output_file_path, 'w') as output_file_handle:
                        for input_file in output_file["inputfiles"]:
                            with open(input_file["path"], 'r') as input_file_handle:
                                output_file_handle.write("// Start of file: " + input_file["path"] + "\n\n")
                                output_file_handle.write(input_file_handle.read())
                                output_file_handle.write("\n\n// End of file: " + input_file["path"] + "\n\n")


        time.sleep(1)
        #break


if __name__ == '__main__':
    maintain()