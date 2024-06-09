import datetime
import os
import shutil

def main():

    # Get timestamp as YYYYMMDD
    timestamp = datetime.datetime.now().strftime("%Y%m%d")

    # Create a new directory for the release.
    release_path = os.path.join("releases", f"release-{timestamp}")
    if os.path.exists(release_path):
        print(f"Release {release_path} already exists")
        return
    os.makedirs(release_path)

    def copy_files(source_folder, file_list):
        for file_name in file_list:
            source_path = os.path.join(source_folder, file_name)
            if not os.path.exists(source_path):
                print(f"File {file_name} not found")
                return
            shutil.copy(source_path, release_path)

    # Copy the device.
    source_folder = "prototype01"
    file_list = [
        "toggle.js",
        "compose.js",
        "config.json",
        "commands.js",
        "device.amxd"
    ]
    copy_files(source_folder, file_list)

    # Copy the readme.
    source_folder = "."
    file_list = [
        "README.md"
    ]
    copy_files(source_folder, file_list)

    # Copy the python files.
    source_folder = "python"
    file_list = [
        "apitest.ipynb",
    ]
    copy_files(source_folder, file_list)

    # Create a zip file of the release directory.
    shutil.make_archive(release_path, "zip", release_path)




if __name__ == "__main__":
    main()