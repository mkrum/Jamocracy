from porc import Client
client = Client('f61515c7-8df9-4003-ab45-2f3e259610ff')
import time

if __name__ =='__main__':
    parties = client.list('parties').all()
    for i in range(0, len(parties)):
        print time.ctime(int(parties[i]['reftime']/ 1000))
