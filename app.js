const dataTraining = window.dataTraining;
const dataTesting = window.dataTesting;

class NaiveBayes {
    /**
     *
     * @param {Array} dataTraining data training
     * @param
     */
    constructor(dataTraining, dataTesting, options) {
        this.aturan = {
            Kebutaan: ["YA", "TIDAK"],
            Umur: ["MUDA", "PARUBAYA", "TUA"],
            Diabetes: ["YA", "TIDAK"],
            Hipertensi: ["YA", "TIDAK"],
            Intraokular: ["RENDAH", "SEDANG", "TINGGI"],
        };

        this.smoothingAlpha = 1;
        this.kelas = "Kebutaan";
        this.totalFitur = 4; // 4 diambil dari aturan di atas dikurangi dengan kebutaan (jadi ada 4)
        this.probability = {};
        this.needSmooth = false;

        this.dataTraining = dataTraining;
        this.dataTesting = dataTesting;
        this.tableUnnormalizedDataTraining = document.querySelector(options.tableUnnormalizedDataTraining);
        this.tableNormalizedDataTraining = document.querySelector(options.tableNormalizedDataTraining);
        this.tableProbability = document.querySelector(options.tableProbability);
        this.areaSmoothedTable = document.querySelector(options.areaSmoothedTable);
        this.tableDataTesting = document.querySelector(options.tableDataTesting);
        this.tableDataTestingResult = document.querySelector(options.tableDataTestingResult);

        this.toggleWrapper();
        this.printUnnormalizedDataTraining();
        this.printNormalizedDataTraining();
        this.printNotSmoothedProbabilityTable();
        this.printTableDataTesting();

        if (this.needSmooth) {
            this.printSmoothedProbabilityTable();
        }

        this.printTableDataTestingResult();
    }

    /**
     * Normalisasi data training berdasarkan aturan data training
     *
     * @return {Array}
     */
    get normalizedDataTraining() {
        return this.normalizeData(this.dataTraining);
    }

    get normalizeDataTesting() {
        return this.normalizeData(this.dataTesting);
    }

    /**
     * Mendapatkan probabilitas untuk kelas kebutaan
     * dari tabel data training
     *
     * @return {Object}
     */
    get probabilityKebutaan() {
        const total = this.dataTraining.length;
        const totalYa = this.dataTraining.reduce((total, data) => {
            return total + (data[this.kelas] == "YA" ? 1 : 0);
        }, 0);
        const totalTidak = this.dataTraining.reduce((total, data) => {
            return total + (data[this.kelas] == "TIDAK" ? 1 : 0);
        }, 0);

        const probabilityYa = totalYa / total;
        const probabilityTidak = totalTidak / total;

        if (probabilityYa < 1 || probabilityTidak < 1) this.needSmooth = true;

        return { total, totalYa, totalTidak, probabilityYa, probabilityTidak };
    }

    /**
     * Mendapatkan probabilitas data training
     *
     * @return {Object}
     */
    get probabilityDataTraining() {
        this.probability = {};

        for (const feature in this.aturan) {
            // check if feature is a class
            if (feature == this.kelas) {
                this.probability[feature] = this.probabilityKebutaan;
            } else {
                this.probability[feature] = this.countProbability(feature);
            }
        }

        return this.probability;
    }

    /**
     * Probabilitas data training yang sudah di smoothing
     * dengan metode laplacian
     */
    get smoothedProbabilityDataTraining() {
        const probabilityKebutaan = this.probabilityKebutaan;
        const newProbability = Object.assign({}, this.probabilityDataTraining);
        for (const feature in newProbability) {
            if (feature != this.kelas) {
                for (const label in newProbability[feature]) {
                    const probs = Object.assign({}, newProbability[feature][label]);
                    probs["YA"] = probs["YA"] + this.smoothingAlpha;
                    probs["TIDAK"] = probs["TIDAK"] + this.smoothingAlpha;
                    probs["probabilityYa"] = probs["YA"] / (probabilityKebutaan["totalYa"] + this.totalFitur);
                    probs["probabilityTidak"] = probs["TIDAK"] / (probabilityKebutaan["totalTidak"] + this.totalFitur);
                    newProbability[feature][label] = probs;
                }
            }
        }
        return newProbability;
    }

    get resultDataTesting() {
        const probability = this.needSmooth ? this.smoothedProbabilityDataTraining : this.probabilityDataTraining;
        return this.dataTesting.map((data) => {
            const newData = Object.assign({}, data);
            newData["Intraokular"] = this.parseIntraokular(newData["Intraokular"]);
            newData["Umur"] = this.parseUmur(newData["Umur"]);

            const kebutaan = this.countKebutaan(probability, newData);

            newData["Kebutaan"] = kebutaan["KebutaanYA"] > kebutaan["KebutaanTIDAK"] ? "YA" : "TIDAK";
            newData["counted_kebutaan"] = kebutaan;

            return newData;
        });
    }

    parseValue(number) {
        return number.toFixed(2);
    }

    /**
     *
     * @param {Number} umur umur pasien
     * @return {String}
     */
    parseUmur(umur) {
        if (umur < 45) return "MUDA";
        else if (umur >= 45 && umur < 55) return "PARUBAYA";
        else return "TUA";
    }

    /**
     *
     * @param {Number} intraokular besar intraokular
     * @return {String}
     */
    parseIntraokular(intraokular) {
        if (intraokular < 21) return "RENDAH";
        else if (intraokular >= 21 && intraokular < 41) return "SEDANG";
        else return "TINGGI";
    }

    /**
     * Normalisasi data berdasarkan aturan yang ada
     *
     * @param {Array} data data yang akan di normalisasikan
     * @returns {Array}
     */
    normalizeData(data) {
        return data.map((item) => {
            const newItem = Object.assign({}, item);
            newItem["Umur"] = this.parseUmur(item["Umur"]);
            newItem["Intraokular"] = this.parseIntraokular(item["Intraokular"]);
            return newItem;
        });
    }

    /**
     * Menghitung probabilitas berdasarkan fitur
     *
     * @param {String} feature
     * @return {Object}
     */
    countProbability(feature) {
        const probabilityKebutaan = this.probabilityKebutaan;
        const probability = {};

        this.aturan[feature].forEach((label) => {
            probability[label] = {};
            probability[label]["YA"] = this.normalizedDataTraining.reduce((total, data) => {
                if (data[feature] == label && data["Kebutaan"] == "YA") return total + 1;
                return total;
            }, 0);
            probability[label]["probabilityYa"] = probability[label]["YA"] / probabilityKebutaan["totalYa"];

            probability[label]["TIDAK"] = this.normalizedDataTraining.reduce((total, data) => {
                if (data[feature] == label && data["Kebutaan"] == "TIDAK") return total + 1;
                return total;
            }, 0);
            probability[label]["probabilityTidak"] = probability[label]["TIDAK"] / probabilityKebutaan["totalTidak"];

            if (probability[label]["probabilityYa"] < 1 || probability[label]["probabilityTidak"] < 1) {
                this.needSmooth = true;
            }
        });

        return probability;
    }

    /**
     * Hitung perkiraan kebutaan pada suatu pasien
     *
     * @param {Object} probability data probabilitas setiap fitur
     * @param {Object} data
     * @return {Object}
     */
    countKebutaan(probability, data) {
        // probabilitas untuk Kebutaan = YA

        // probabilitas untuk Kebutaan = TIDAK

        const probKebutaan = {
            FiturYA: 1,
            FiturTIDAK: 1,
        };

        for (const feature in probability) {
            if (feature == this.kelas) {
                probKebutaan["FiturYA"] = probKebutaan["FiturYA"] * probability[feature].probabilityYa;
                probKebutaan["FiturTIDAK"] = probKebutaan["FiturTIDAK"] * probability[feature].probabilityTidak;
                continue;
            }

            probKebutaan["FiturYA"] = probKebutaan["FiturYA"] * probability[feature][data[feature]].probabilityYa;
            probKebutaan["FiturTIDAK"] = probKebutaan["FiturTIDAK"] * probability[feature][data[feature]].probabilityTidak;
        }

        probKebutaan["KebutaanYA"] = probKebutaan["FiturYA"] / (probKebutaan["FiturYA"] + probKebutaan["FiturTIDAK"]);
        probKebutaan["KebutaanTIDAK"] = probKebutaan["FiturTIDAK"] / (probKebutaan["FiturYA"] + probKebutaan["FiturTIDAK"]);

        return probKebutaan;
    }

    /**
     * Menambahkan data testing
     *
     * @param {Object} ev event ketika submit
     */
    addDataTesting(ev) {
        ev.preventDefault();
        const form = ev.target;

        if (form.pasien.value.length < 1 || parseInt(form.umur.value) < 1 || parseInt(form.intraokular.value) < 1) return alert("Form harus terisi semua!");

        this.dataTesting.push({
            "Nama Pasien": form.pasien.value,
            Umur: parseInt(form.umur.value),
            Intraokular: parseInt(form.intraokular.value),
            Diabetes: form.diabetes.value,
            Hipertensi: form.hipertensi.value,
            Kebutaan: "",
        });

        form.pasien.value = "";
        form.umur.value = "";
        form.intraokular.value = "";

        this.printTableDataTesting();
        this.printTableDataTestingResult();
    }

    /**
     * Menambahkan data testing
     *
     * @param {Object} ev event ketika submit
     * @param {Number} idx indeks data ke-i
     */
    deleteDataTesting(ev, idx) {
        ev.preventDefault();
        this.dataTesting = this.dataTesting.filter((data, index) => {
            if (idx !== index) return data;
        });

        this.printTableDataTesting();
        this.printTableDataTestingResult();
    }

    /**
     * Menambahkan data training
     *
     * @param {Object} ev event ketika submit
     */
    addDataTraining(ev) {
        ev.preventDefault();
        const form = ev.target;

        if (form.pasien.value.length < 1 || parseInt(form.umur.value) < 1 || parseInt(form.intraokular.value) < 1) return alert("Form harus terisi semua!");

        this.dataTraining = [
            {
                "Nama Pasien": form.pasien.value,
                Umur: parseInt(form.umur.value),
                Intraokular: parseInt(form.intraokular.value),
                Diabetes: form.diabetes.value,
                Hipertensi: form.hipertensi.value,
                Kebutaan: form.kebutaan.value,
            },
            ...this.dataTraining,
        ];

        form.pasien.value = "";
        form.umur.value = "";
        form.intraokular.value = "";

        this.printUnnormalizedDataTraining();
        this.printNormalizedDataTraining();
        this.printNotSmoothedProbabilityTable();
        this.printSmoothedProbabilityTable();
    }

    /**
     * Print data ke dalam tabel
     *
     * @param {Element} el
     * @param {Array} data
     */
    printTable(el, data, deleteable = false) {
        let html = "";
        data.forEach((item, idx) => {
            html += `
            <tr>
                <td>${item["Nama Pasien"]}</td>
                <td>${item["Umur"]}</td>
                <td>${item["Diabetes"]}</td>
                <td>${item["Hipertensi"]}</td>
                <td>${item["Intraokular"]}</td>
                ${item["Kebutaan"] != "" ? `<td><span style="font-weight:600;color:${item["Kebutaan"] == "YA" ? "#e43232" : "#1bca55"}">${item["Kebutaan"]}</span></td>` : ""}
                ${deleteable ? `<td><button onclick="app.deleteDataTesting(event, ${idx})" class="danger">Hapus</button></td>` : ""}
            </tr>
            `;
        });
        el.innerHTML = html;
    }

    /**
     * Print tabel data training yang belum di normalkan
     */
    printUnnormalizedDataTraining() {
        this.printTable(this.tableUnnormalizedDataTraining, this.dataTraining);
    }

    /**
     * Print tabel data training yang sudah di normalkan
     */
    printNormalizedDataTraining() {
        this.printTable(this.tableNormalizedDataTraining, this.normalizedDataTraining);
    }

    /**
     * Print tabel probabilitas yang belum di smoothing
     * dengan laplacian smoothing
     */
    printNotSmoothedProbabilityTable() {
        this.printTableProbability(this.tableProbability, this.probabilityDataTraining);
    }

    /**
     * Print tabel probabilitas yang telah di smoothing
     */
    printSmoothedProbabilityTable() {
        const probability = this.smoothedProbabilityDataTraining;
        this.printTableProbability(this.areaSmoothedTable.querySelector("#tableSmoothedProbability"), probability);
        this.areaSmoothedTable.querySelector("td.nilai-alpha").innerText = this.smoothingAlpha;
        this.areaSmoothedTable.querySelector("td.jml-fitur").innerText = this.totalFitur;
        this.areaSmoothedTable.classList.remove("hidden");
    }

    /**
     * Print tabel probabilitas
     *
     * @param {Element} el
     * @param {Object} probability
     */
    printTableProbability(el, probability) {
        el.innerHTML = `
            <thead>
                <tr>
                    <th>#</th>
                    <th>Label</th>
                    <th>Nilai</th>
                    <th>P(YA)</th>
                    <th>P(TIDAK)</th>
                </tr>
            </thead>
            <tbody>
                ${(() => {
                    let html = `
                    <tr>
                        <td>1</td>
                        <td colspan="2" class="text-center">${this.kelas}</td>
                        <td>${this.parseValue(probability[this.kelas].probabilityYa)}</td>
                        <td>${this.parseValue(probability[this.kelas].probabilityTidak)}</td>
                    </tr>
                    `;
                    let iteration = 0;
                    let before = null;

                    for (const feature in probability) {
                        iteration += 1;
                        if (feature != this.kelas) {
                            for (const label in probability[feature]) {
                                html += `
                                    <tr>
                                        ${
                                            before != feature
                                                ? `<td rowspan="${Object.keys(probability[feature]).length}">${iteration}</td>
                                        <td class="text-center" rowspan="${Object.keys(probability[feature]).length}">${feature}</td>`
                                                : ""
                                        }
                                        <td>${label}</td>
                                        <td>${this.parseValue(probability[feature][label]["probabilityYa"])}</td>
                                        <td>${this.parseValue(probability[feature][label]["probabilityTidak"])}</td>
                                    </tr>
                                `;
                                before = feature;
                            }
                        }
                    }

                    return html;
                })()}
            </tbody>
        `;
    }

    /**
     * Print data testing
     */
    printTableDataTesting() {
        this.printTable(this.tableDataTesting, this.dataTesting, true);
    }

    /**
     * Print data testing
     */
    printTableDataTestingResult() {
        this.printTable(this.tableDataTestingResult, this.resultDataTesting);
    }

    toggleWrapper() {
        document.querySelectorAll('[data-toggle="toggle-wrapper"]').forEach((wrapper) => {
            wrapper.addEventListener("click", (ev) => {
                ev.preventDefault();
                ev.target.parentNode.querySelector(".row").classList.toggle("hidden");
            });
        });
    }
}

window.app = new NaiveBayes(dataTraining, dataTesting, {
    tableUnnormalizedDataTraining: "#tableUnnormalizedDataTraining",
    tableNormalizedDataTraining: "#tableNormalizedDataTraining",
    tableProbability: "#tableProbability",
    areaSmoothedTable: "#areaSmoothedTable",
    tableDataTesting: "#tableDataTesting",
    tableDataTestingResult: "#tableDataTestingResult",
});
