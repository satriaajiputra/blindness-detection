# Blindness Detection

Deteksi kebutaan menggunakan Algoritma Naive Bayes

## Aturan
| Umur  |          | Diabetes | Hipertensi | Intraokular |        | 
|-------|----------|----------|------------|-------------|--------| 
| 35-44 | MUDA     | YA       | YA         | < 21        | RENDAH | 
| 45-54 | PARUBAYA | TIDAK    | TIDAK      | 21-41       | SEDANG | 
| 55-65 | TUA      |          |            | 41-61       | TINGGI | 


## Data Training
| Nama Pasien | Umur | Diabetes | Hipertensi | Intraokular | Kebutaan | 
|-------------|------|----------|------------|-------------|----------| 
| Ali Topan   | 56   | YA       | TIDAK      | 61          | YA       | 
| Sartika     | 41   | TIDAK    | YA         | 39          | YA       | 
| Mika        | 52   | YA       | TIDAK      | 58          | TIDAK    | 
| Ruby        | 69   | YA       | TIDAK      | 42          | YA       | 
| Bian Utami  | 48   | YA       | YA         | 35          | TIDAK    | 
| Riandari    | 66   | TIDAK    | YA         | 54          | TIDAK    | 
| Uli Alwan   | 55   | TIDAK    | TIDAK      | 31          | TIDAK    | 
| Kanita      | 56   | YA       | TIDAK      | 48          | YA       | 
| Sarini      | 67   | TIDAK    | YA         | 36          | YA       | 
| Rafina      | 73   | TIDAK    | YA         | 40          | TIDAK    | 
| Budiman     | 38   | YA       | YA         | 33          | YA       | 
| Sartika     | 51   | TIDAK    | YA         | 36          | TIDAK    | 
| Mika        | 59   | TIDAK    | TIDAK      | 24          | TIDAK    | 
| Ruby        | 37   | YA       | TIDAK      | 37          | TIDAK    | 
| Kanita      | 65   | YA       | TIDAK      | 43          | TIDAK    | 
| Sarita      | 61   | YA       | YA         | 36          | TIDAK    | 
| Budian      | 46   | TIDAK    | YA         | 41          | YA       | 
| Sartika     | 64   | YA       | TIDAK      | 21          | YA       | 
| Miko        | 36   | TIDAK    | YA         | 43          | TIDAK    | 
| Riandani    | 39   | TIDAK    | YA         | 56          | YA       | 
| Ulilwan     | 72   | YA       | TIDAK      | 44          | TIDAK    | 
| Kanisa      | 36   | YA       | YA         | 33          | YA       | 
| Sarina      | 62   | YA       | TIDAK      | 27          | TIDAK    | 
| Budiana     | 71   | TIDAK    | YA         | 52          | TIDAK    | 
| Santika     | 44   | YA       | TIDAK      | 34          | TIDAK    | 
| Safira      | 37   | TIDAK    | TIDAK      | 22          | YA       | 
| Mira        | 55   | TIDAK    | YA         | 61          | YA       | 
| Rianti      | 62   | YA       | YA         | 34          | YA       | 
| Cici        | 40   | YA       | TIDAK      | 32          | TIDAK    | 
| Ina         | 72   | YA       | TIDAK      | 58          | YA       | 
| Mima        | 63   | TIDAK    | TIDAK      | 21          | TIDAK    | 
| Naya        | 68   | YA       | TIDAK      | 39          | TIDAK    | 
| Sarina      | 66   | TIDAK    | TIDAK      | 45          | TIDAK    | 

## Data Testing
| Nama Pasien  | Umur | Diabetes | Hipertensi | Intraokular | 
|--------------|------|----------|------------|-------------| 
| Nata         | 73   | YA       | TIDAK      | 54          | 
| Rafa         | 60   | YA       | TIDAK      | 29          | 
| Alin         | 35   | YA       | YA         | 40          | 
| Suti         | 58   | TIDAK    | TIDAK      | 42          | 
| Lani         | 53   | TIDAK    | YA         | 38          | 
