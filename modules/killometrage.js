const config = require('../modules/config');
const mysql = require("mysql2");

var conn = mysql.createConnection(config);

module.exports = function (app) {
    // app.get(killometrage): Obtien toutes les killometrages de la personne connecter
    app.get('/killometrage', (req, res) => {
        const id = req.query.id;

        if (id > 0) {
            let query = "CALL defaultdb.getKillometrage(?)";
            conn.query(query, id, (err, result) => {
                if (err) { throw err; }
                res.send({ Killometrage: result[0] });
            });
        } else {
            console.log("Aucun utilisateur connecté");
            res.send({ message: "Aucun utilisateur connecté" });
        }
    });

    // app.get('/killometrage/compagnie'): permet de 
    app.get('/killometrage/compagnie', (req, res) => {
        const id = req.query.id;

        if (id > 0) {
            let query = "SELECT id_compagnie AS id, nom_compagnie AS nom FROM compagnie WHERE id_utilisateur = ?"
            conn.query(query, id, (err, result) => {
                if (err) { throw err; }
                console.log(result);
                res.send({ Compagnie: result });
            });
        } else {
            console.log("Aucun utilisateur connecté");
            res.send({ message: "Aucun utilisateur connecté" });
        }
    });

    // Enregistre un killometrage en BD
    app.post('/killometrage', (req, res) => {
        const distance = req.body.distance;
        const lieuxDepart = req.body.lieuxDepart;
        const lieuxArrive = req.body.lieuxArrive;
        const tempsDepart = req.body.tempsDepart;
        const tempsArrive = req.body.tempsArrive;
        const commentaire = req.body.commentaire;
        const idCompagnie = req.body.idCompagnie;
        const id = req.body.id;

        if (id > 0) {
            let query = "INSERT INTO killometrage (distance_killometrage, lieux_depart_killometrage, lieux_arrive_killometrage, temps_depart_killometrage, temps_arrive_killometrage, commentaire_killometrage, id_compagnie) VALUES (?)";
            let depart = new Date(tempsDepart);
            let arrive = new Date(tempsArrive);
            let killometrage = [

                [distance, lieuxDepart, lieuxArrive, depart, arrive, commentaire, idCompagnie]

            ];

            conn.query(query, killometrage, (err, result) => {
                if (err) { throw err; }
                console.log("Ajout killometrage: " + result.affectedRows);
                res.send({ Killometrage: "Ajout killometrage: " + result.affectedRows });
            })
        } else {
            console.log("Kilo non enregistré");
            res.send({ message: "Kilo non enregistré" });
        }
    });

    //app.put(killometrage): Permet la modification d'un killometrage
    app.put('/killometrage', (req, res) => {
        const id = req.body.idUtilisateur;
        const idKillo = req.body.idKillometrage;
        const distance = req.body.distance;
        const lieuxDepart = req.body.lieuxDepart;
        const lieuxArrive = req.body.lieuxArrive;
        const tempsDepart = req.body.tempsDepart;
        const tempsArrive = req.body.tempsArrive;
        const commentaire = req.body.commentaire;
        const idCompagnie = req.body.idCompagnie;

        if (id > 0) {
            let query = "CALL defaultdb.modificationKillometrage(?)";
            let depart = new Date(tempsDepart);
            let arrive = new Date(tempsArrive);
            let killometrage = [
                [idKillo, distance, lieuxDepart, lieuxArrive, depart, arrive, commentaire, idCompagnie]
            ];

            conn.query(query, killometrage, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Modification du killometrage");
                    res.send({ Modification: result });
                }
            });
        } else {
            console.log("Aucun utilisateur connecté pour modifier");
            res.send({ Message: "Aucun utilisateur connecté pour modifier" });
        }
    });

    //app.delete(killometrage): enlever un killometrage de la base de donnees
    app.delete('/killometrage', (req, res) => {
        const id = req.body.idUtilisateur;
        const idKillo = req.body.idKillometrage;

        if (id > 0) {
            let query = "DELETE FROM killometrage WHERE id_killometrage=?";
            conn.query(query, [idKillo], (err, result) => {
                if (err) { throw err; }
                console.log("Killometrage supprimer, champs affecter: " + result.affectedRows);
                res.send({ Compagnie: "Killometrage supprimer, champs affecter: " + result.affectedRows });
            });
        } else {
            res.send({ message: "Aucun utilisateur connecté." });
        }
    });
}