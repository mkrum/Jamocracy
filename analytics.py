from porc import Client
client = Client('f61515c7-8df9-4003-ab45-2f3e259610ff')

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
    print getAreaCodes(song)

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

def getAreaCodes(song):
    # song = client.get('songs', song)

    numbers = song['value']['numbers']
    for i in range(0, len(numbers)):
        print numbers[i][2:5]

if __name__ == '__main__':
    print " JAMOCRACY STATS"
    displayNumUsers()
    mostPopularSong()
    #displayNumSongs()
    #printSongs()

     
