from porc import Client
from collections import defaultdict
import time

client = Client('f61515c7-8df9-4003-ab45-2f3e259610ff')


def displayNumUsers():
    numbers = client.list('numbers').all()
    return str(len(numbers))

def mostPopularSong():
    songs = client.list('songs').all()
    max = 0;
    songName = ''
    for i in range(0, len(songs)):
        if (songs[i]['value']['playCount'] > max):
            max = songs[i]['value']['playCount']
            songName = songs[i]['path']['key']
            song = songs[i]
    return songName

def displayNumSongs():
    songs = client.list('songs').all()
    return str(len(songs))

if __name__ == '__main__':
    print displayNumUsers()+','+displayNumSongs()+','+mostPopularSong()+','+str(time.time())
