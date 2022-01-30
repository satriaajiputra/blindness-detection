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

        this.dataTraining = dataTraining;
        this.dataTesting = dataTesting;
        this.tableUnnormalizedDataTraining = document.querySelector(options.tableUnnormalizedDataTraining);
        this.tableNormalizedDataTraining = document.querySelector(options.tableNormalizedDataTraining);
        this.tableProbability = document.querySelector(options.tableProbability);
        this.areaSmoothedTable = document.querySelector(options.areaSmoothedTable);
        this.areaNoSmoothedTable = document.querySelector(options.areaNoSmoothedTable);
        this.tableDataTesting = document.querySelector(options.tableDataTesting);
        this.tableDataTestingResult = document.querySelector(options.tableDataTestingResult);

        this.toggleWrapper();
        this.printUnnormalizedDataTraining();
        this.printNormalizedDataTraining();
        this.printNotSmoothedProbabilityTable();
        this.printTableDataTesting();

        if (this.needSmooth) {
            this.printSmoothedProbabilityTable();
        } else {
            this.areaSmoothedTable.classList.add("hidden");
            this.areaNoSmoothedTable.classList.remove("hidden");
        }

        this.printTableDataTestingResult();

        this.printText("outJmlData", this.probabilityKebutaan.total);
        this.printText("outJmlYa", this.probabilityKebutaan.totalYa);
        this.printText("outJmlTidak", this.probabilityKebutaan.totalTidak);
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
                    probs["totalYa"] = probabilityKebutaan["totalYa"] + this.totalFitur;
                    probs["totalTidak"] = probabilityKebutaan["totalTidak"] + this.totalFitur;
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

    get needSmooth() {
        const probability = this.probabilityDataTraining;
        let smooth = false;
        for (const feature in probability) {
            if (feature == this.kelas) {
                smooth = probability[feature].probabilityYa === 0 || probability[feature].probabilityTidak === 0;
                if (smooth) break;
                continue;
            }

            for (const state in this.aturan[feature]) {
                const prob = probability[feature][this.aturan[feature][state]];
                smooth = prob.probabilityYa === 0 || prob.probabilityTidak === 0;
                if (smooth) break;
            }
            if (smooth) break;
        }
        return smooth;
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

            probability[label]["totalYa"] = probabilityKebutaan["totalYa"];
            probability[label]["totalTidak"] = probabilityKebutaan["totalTidak"];
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
        const probKebutaan = {
            FiturYA: 1,
            FiturTIDAK: 1,
            CountFiturYa: [],
            CountFiturTidak: [],
            Kriteria: `UMUR(${data.Umur}), DIABETES(${data.Diabetes}), HIPERTENSI(${data.Hipertensi}), INTRAOKULAR(${data.Intraokular})`,
        };

        for (const feature in probability) {
            if (feature == this.kelas) {
                probKebutaan["FiturYA"] = probKebutaan["FiturYA"] * probability[feature].probabilityYa;
                probKebutaan["FiturTIDAK"] = probKebutaan["FiturTIDAK"] * probability[feature].probabilityTidak;
                probKebutaan["CountFiturYa"].push(`(${probability[feature].totalYa}/${probability[feature].total})`);
                probKebutaan["CountFiturTidak"].push(`(${probability[feature].totalTidak}/${probability[feature].total})`);
                continue;
            }

            const prob = probability[feature][data[feature]];
            probKebutaan["FiturYA"] = probKebutaan["FiturYA"] * prob.probabilityYa;
            probKebutaan["FiturTIDAK"] = probKebutaan["FiturTIDAK"] * prob.probabilityTidak;

            probKebutaan["CountFiturYa"].push(`(${prob.YA}/${prob.totalYa})`);
            probKebutaan["CountFiturTidak"].push(`(${prob.TIDAK}/${prob.totalTidak})`);
        }

        probKebutaan["CountFiturYa"] = probKebutaan["CountFiturYa"].join(" X ") + " = " + this.parseValue(probKebutaan["FiturYA"]);
        probKebutaan["CountFiturTidak"] = probKebutaan["CountFiturTidak"].join(" X ") + " = " + this.parseValue(probKebutaan["FiturTIDAK"]);

        probKebutaan["KebutaanYA"] = probKebutaan["FiturYA"] / (probKebutaan["FiturYA"] + probKebutaan["FiturTIDAK"]);
        probKebutaan["KebutaanTIDAK"] = probKebutaan["FiturTIDAK"] / (probKebutaan["FiturYA"] + probKebutaan["FiturTIDAK"]);
        probKebutaan["CountYA"] = `${this.parseValue(probKebutaan["FiturYA"])} / (${this.parseValue(probKebutaan["FiturYA"])} + ${this.parseValue(
            probKebutaan["FiturTIDAK"]
        )}) = <strong>${this.parseValue(probKebutaan["KebutaanYA"])}</strong>`;
        probKebutaan["CountTIDAK"] = `${this.parseValue(probKebutaan["FiturTIDAK"])} / (${this.parseValue(probKebutaan["FiturYA"])} + ${this.parseValue(
            probKebutaan["FiturTIDAK"]
        )}) = <strong>${this.parseValue(probKebutaan["KebutaanTIDAK"])}</strong>`;

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

        this.printText("outJmlData", this.probabilityKebutaan.total);
        this.printText("outJmlYa", this.probabilityKebutaan.totalYa);
        this.printText("outJmlTidak", this.probabilityKebutaan.totalTidak);

        this.printUnnormalizedDataTraining();
        this.printNormalizedDataTraining();
        this.printNotSmoothedProbabilityTable();
        this.printSmoothedProbabilityTable();
        this.printTableDataTestingResult();

        this.probabilityDataTraining;

        if (!this.needSmooth) {
            this.areaSmoothedTable.classList.add("hidden");
            this.areaNoSmoothedTable.classList.remove("hidden");
        }
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
                    const probKebutaan = probability[this.kelas];
                    let html = `
                    <tr>
                        <td>1</td>
                        <td colspan="2" class="text-center">${this.kelas}</td>
                        <td>${probKebutaan.totalYa} / ${probKebutaan.total} = <strong>${this.parseValue(probKebutaan.probabilityYa)}</strong></td>
                        <td>${probKebutaan.totalTidak} / ${probKebutaan.total} = <strong>${this.parseValue(probKebutaan.probabilityTidak)}</strong></td>
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
                                        <td>${probability[feature][label].YA}/${probability[feature][label].totalYa} = <strong>${this.parseValue(
                                    probability[feature][label].probabilityYa
                                )}</strong></td>
                                        <td>${probability[feature][label].TIDAK}/${probability[feature][label].totalTidak} = <strong>${this.parseValue(
                                    probability[feature][label].probabilityTidak
                                )}</strong></td>
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
        let html = "";
        this.resultDataTesting.forEach((item, idx) => {
            const counted = item.counted_kebutaan;
            html += `
            <tr>
                <td>${item["Nama Pasien"]}</td>
                <td>
                    <strong>Kriteria:</strong><br/>${counted.Kriteria}<br/><br/>
                    <strong>(YA | ${item["Nama Pasien"]}):</strong> ${counted.CountFiturYa} <br/>
                    <strong>(TIDAK | ${item["Nama Pasien"]}):</strong> ${counted.CountFiturTidak} <br/> <br/>

                    <strong>Kebutaan:</strong><br/>
                    <strong>(${item["Nama Pasien"]} | YA):</strong> ${counted.CountYA} <br/>
                    <strong>(${item["Nama Pasien"]} | TIDAK):</strong> ${counted.CountTIDAK} <br/><br/>

                    <strong>Peluang Kebutaan:</strong> <span style="font-weight:600;color:${item["Kebutaan"] == "YA" ? "#e43232" : "#1bca55"}">${item["Kebutaan"]}</span>
                </td>
            </tr>
            `;
        });
        this.tableDataTestingResult.innerHTML = html;
    }

    toggleWrapper() {
        document.querySelectorAll('[data-toggle="toggle-wrapper"]').forEach((wrapper) => {
            wrapper.addEventListener("click", (ev) => {
                ev.preventDefault();
                ev.target.parentNode.querySelector(".row").classList.toggle("hidden");
            });
        });
    }

    printText(id, text) {
        document.getElementById(id).innerHTML = text;
    }
}

window.app = new NaiveBayes(dataTraining, dataTesting, {
    tableUnnormalizedDataTraining: "#tableUnnormalizedDataTraining",
    tableNormalizedDataTraining: "#tableNormalizedDataTraining",
    tableProbability: "#tableProbability",
    areaSmoothedTable: "#areaSmoothedTable",
    areaNoSmoothedTable: "#areaNoSmoothedTable",
    tableDataTesting: "#tableDataTesting",
    tableDataTestingResult: "#tableDataTestingResult",
});
