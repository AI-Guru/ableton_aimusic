# Ableton Music GPT Plugin (by Dr. Tristan Behrens)

Thanks a lot for your interest in bridging the gap between Generative AI for music and Ableton Live! This release includes a very early prototype of an Ableton plugin (device). The fact you are reading this makes me super happy, because it shows that you are supporting my work. Thanks a lot!


## What is new in this release?

- Due to popular demand you can generate MIDI files when using the Python API. Note this does not concern the Ableton functionality. The notebook shows how.





---------

Old stuff



## Important things at the beginning

In its current manifestation, the tool works as a client-server app. The server is hosted by me on my own hardware. You computer will run the plugin. Of course, you need to be connected to the internet to be able to compose. Also I will collect usage data to improve the creative experience. Note that the data I will collect will not be released to the public.

Also, by using this prototype you aggree that I will not be responsible if something goes wrong. Of course this is very unlikely, but I want you to be aware that this is a prototype, and that things might go wrong.


## Submitting issues and feature requests.

Feel free to reach out to me if you run into any issues. And of course do not hesitate to share feature requests. I am very eager to improve the experience and every comment will be useful.


## What you get so far

- A straightforward possibility to generate music via AI.
- The generation is multi-track.


## Known issues and plan

Things that I am already aware of:

- The user interface is not the most beautiful. As always: "content before chrome". Things will get nicer looking once the basic functionality is there.
- The AI models are only available via the API. So far there are no plans to release the models. However, I am considering releasing composing applications that you can run on your computer without the need for an API.
- Chord conditioning is in the pipeline. It is very likely that I will release a version that allows you to specify a chord progression, and the AI will compose multiple tracks following that chord progression.
- The current prototype only works with 4 bars at a time. Everything else is very likely to cause trouble. Future versions will make it possible to work with music that is shorter and longer.
- Inpainting - I mean: filling in missing bars - is not supported yet. It is planned for a future release.


# Installation and how-to

Here is a video that will get you started: https://www.youtube.com/watch?v=wGk_atla6Gc

You need an API token in order to run the plugin.

# Non Disclosure?

Feel free to talk about this plugin whenever you like, including posts on social media. Preferably positive ones 🤗 Please do not share your API token.