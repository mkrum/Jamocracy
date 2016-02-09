from porc import Client
from collections import defaultdict
import csv
client = Client('f61515c7-8df9-4003-ab45-2f3e259610ff')

reader = csv.reader(open('areacodes.csv', 'r'))
d = {}
for row in reader:
   k, v = row
   d[k] = v

def displayNumUsers():
    numbers = client.list('numbers').all()
    print 'Number of users: ',len(numbers)

def mostPopularSong():
    songs = client.list('songs').all()
    max = 0;
    songName = ''
    for i in range(0, len(songs)):
        if (songs[i]['value']['playCount'] > max):
            max = songs[i]['value']['playCount']
            songName = songs[i]['path']['key']
            song = songs[i]
    print "Most Popular Song: ", songName
    print "Plays: ", max
    getAreaCodes(song)

def displayNumSongs():
    songs = client.list('songs').all()
    print 'Number of Songs: ', len(songs)

def printSongs():
    songs = client.list('songs').all()
    for i in range(0, len(songs)):
        print 'Song: ',songs[i]['path']['key'], '// Plays: ', songs[i]['value']['playCount']

def printNumbers():
    numbers = client.list('numbers').all()
    for i in range(0, len(numbers)):
        print numbers[i]

#song object from the database
def getAreaCodes(song):
    numbers = song['value']['numbers']
    Numb = defaultdict(int)
    for i in range(0, len(numbers)):
        Numb[numbers[i][2:5]] += 1
    codes = sorted(Numb)
    for i in range(0, len(codes)):
        print d[codes[len(codes) - i - 1]],"     ", Numb[codes[len(codes) - i - 1]]

if __name__ == '__main__':
    print " JAMOCRACY STATS"
    displayNumUsers()
    mostPopularSong()
    displayNumSongs()
    printSongs()
    
     
