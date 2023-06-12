const config = require('./config.js');
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const validation = require('../Util/validation.js');

var conn = mysql.createConnection(config);

module.exports = function (app) {
    // app.get(/Profil) recois toutes les informations du profil
    app.get('/profil', (req, res) => {
        if (req.session.user) {
            conn.connect(function (error) {
                if (error) {
                    throw error;
                }
                let query1 = "SELECT nom_utilisateur, prenom_utilisateur, courriel_utilisateur, telephone_utilisateur FROM utilisateur WHERE id_utilisateur = ?";
                let query2 = "CALL defaultdb.getCompagnie(?)";
                let query3 = "CALL defaultdb.getForfait(?)";

                conn.query(query1, req.session.user.id, (err, result) => {
                    if (err) {
                        console.log("Erreur requete");
                        throw err;
                    } else {
                        console.log("Info de l'utilisateur obtenue");
                        conn.query(query2, req.session.user.id, (err, result2) => {
                            if (err) {
                                console.log("Erreur requete");
                                throw err;
                            } else {
                                console.log("Info de compagnie obtenue");
                                conn.query(query3, req.session.user.id, (err, result3) => {
                                    if (err) {
                                        console.log("Erreur requete");
                                        throw err;
                                    } else {
                                        console.log("Info de forfaits obtenue");
                                        res.send({ Utilisateur: result[0], Compagnies: result2[0], Forfaits: result3[0] });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        } else {
            console.log("Aucun utilisateur connecter a montrer au profil");
            res.send({ message: "Aucun utilisateur a montrer" });
        }
    });

    // app.get(/profilUtilisateur): Recois les infos de l'utilisateur
    app.get('/profilUtilisateur', (req, res) => {
        if (req.session.user) {
            let query = "SELECT nom_utilisateur, prenom_utilisateur, courriel_utilisateur, telephone_utilisateur FROM utilisateur WHERE id_utilisateur = ?";
            conn.query(query, req.session.user.id, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Info de l'utilisateur obtenue");
                    res.send({ Utilisateur: result[0] });
                }
            });
        } else {
            res.send({ message: "Aucun utilisateur connecté" });
        }
    });

    // app.put(/Profil) Modification pour l'utilisateur
    app.put('/profil', (req, res) => {
        const nom = req.body.nom;
        const prenom = req.body.prenom;
        const motDePasse = req.body.motDePasse;
        const telephone = req.body.telephone;

        if (req.session.user) {
            if (Object.keys(motDePasse).length > 5) {
                bcrypt.hash(motDePasse, saltRounds, (error, hashedPwd) => {
                    if (error) {
                        throw err;
                    }
                    let query = "CALL defaultdb.modificationProfil(?)";

                    let utilisateur = [
                        [req.session.user.id, nom, prenom, hashedPwd, telephone]
                    ];
                    conn.query(query, utilisateur, (err, result) => {
                        if (err) {
                            throw err;
                        } else {
                            console.log("Modification de l'utilisateur avec mot de passe");
                            res.send({ Modification: result });
                        }
                    });
                });
            } else {
                let query = "CALL defaultdb.modificationProfil(?)";

                let utilisateur = [
                    [req.session.user.id, nom, prenom, '', telephone]
                ];
                conn.query(query, utilisateur, (err, result) => {
                    if (err) {
                        throw err;
                    } else {
                        console.log("Modification de l'utilisateur");
                        res.send({ Modification: result });
                    }
                });
            }
        } else {
            console.log("Aucun utilisateur connecté a modifier");
            res.send({ Message: "Aucun utilisateur connecté a modifier" })
        }
    });

    // app.get(/profilCompagnie): Recois seulement les infos sur les compagnies de l'utilisateur
    app.get('/profilCompagnie', (req, res) => {
        if (req.session.user) {
            let query = "CALL defaultdb.getCompagnie(?)";
            conn.query(query, req.session.user.id, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Info de compagnie de l'utilisateur obtenue");
                    res.send({ Compagnie: result[0] });
                }
            });
        } else {
            res.send({ message: "Aucun utilisateur connecté" });
        }
    });

    // app.post(/profilCompagnie) ajout d'une compagnie a l'utilisateur
    app.post("/profilCompagnie", (req, res) => {
        const nom = req.body.nom;
        const adresse = req.body.adresse;
        const noRegistre = req.body.noRegistre;
        const courriel = req.body.courriel;
        const telephone = req.body.telephone;

        if (req.session.user) {
            let courrielMinuscule = courriel.toLowerCase();
            if (validation.courriel(courcourrielMinusculeriel, res)) {
                if (Object.keys(nom).length > 0 && noRegistre != null) {
                    let query1 = "SELECT noRegistre_compagnie FROM compagnie WHERE id_utilisateur = ?";
                    let compagnie = [
                        [nom, adresse, noRegistre, courrielMinuscule, telephone, req.session.user.id]
                    ];

                    conn.query(query1, req.session.user.id, (err, result) => {
                        if (err) {
                            throw err;
                        }
                        let isUnique = true;
                        result.forEach(registre => {
                            if (registre.noRegistre_compagnie === noRegistre) {
                                isUnique = false;
                            }
                        });
                        if (isUnique) {
                            let query2 = "INSERT INTO compagnie (nom_compagnie, adresse_compagnie, noRegistre_compagnie, courriel_compagnie, telephone_compagnie, id_utilisateur) VALUES ?";
                            conn.query(query2, [compagnie], (error, insert) => {
                                if (error) { throw error; }
                                console.log("Ajout compagnie, champs affecter: " + insert.affectedRows);
                                res.send({ AjoutCompagnie: "Ajout compagnie, champs affecter: " + insert.affectedRows });
                            });
                        } else {
                            res.send({ message: "Le numero de registre existe deja, veuillez en entrer un autre" });
                        }
                    });
                } else {
                    res.send({ message: "Un nom et un no de registre est requis" });
                }
            }
        }
    });

    // app.put(/profilCompagnie): modification d'une compagnie dans le profil
    app.put("/profilCompagnie", (req, res) => {
        const nom = req.body.nom;
        const adresse = req.body.adresse;
        const noRegistre = req.body.noRegistre;
        const courriel = req.body.courriel;
        const telephone = req.body.telephone;
        const noRegistreActuel = req.body.noRegistreActuel;

        if (req.session.user) {
            if (Object.keys(courriel).length < 1) {
                let query = "CALL defaultdb.modificationCompagnie(?)";
                let compagnie = [
                    [nom, adresse, noRegistre, courriel, telephone, noRegistreActuel, req.session.user.id]
                ];

                conn.query(query, compagnie, (err, result) => {
                    if (err) {
                        throw err;
                    } else {
                        console.log("Modification compagnie, lignes affectées: " + result.affectedRows)
                        res.send({ ModifCompagnie: "Success " + result.affectedRows });
                    }
                });
            } else {
                let courrielMinuscule = courriel.toLowerCase();
                if (validation.courriel(courrielMinuscule, res)) {
                    let query = "CALL defaultdb.modificationCompagnie(?)";
                    let compagnie = [
                        [nom, adresse, noRegistre, courrielMinuscule, telephone, noRegistreActuel, req.session.user.id]
                    ];

                    conn.query(query, compagnie, (err, result) => {
                        if (err) {
                            throw err;
                        } else {
                            console.log("Modification compagnie, lignes affectées: " + result.affectedRows)
                            res.send({ ModifCompagnie: "Success " + result.affectedRows });
                        }
                    });
                }
            }
        }
    });

    // app.delete(/profilCompagnie): Permet de supprimmer une compagnie pour l'utilisateur dans son profil
    app.delete('/profilCompagnie', (req, res) => {
        const noRegistre = req.body.noRegistre;
        console.log(noRegistre)
        if (req.session.user) {
            let query = "DELETE FROM compagnie WHERE id_utilisateur=? AND noRegistre_compagnie=?";
            conn.query(query, [req.session.user.id, noRegistre], (err, result) => {
                if (err) { throw err; }
                console.log("Compagnie supprimer, champs affecter: " + result.affectedRows);
                res.send({ Compagnie: "Compagnie supprimer, champs affecter: " + result.affectedRows });
            });
        } else {
            res.send({ message: "Aucun utilisateur connecté." });
        }
    });

    // app.get(/profilForfait): Recois seulement les infos sur les forfait de l'utilisateur
    app.get('/profilForfait', (req, res) => {
        if (req.session.user) {
            let query = "CALL defaultdb.getForfait(?)";
            conn.query(query, req.session.user.id, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Info de forfait de l'utilisateur obtenue");
                    res.send({ Forfait: result[0] });
                }
            });
        } else {
            res.send({ message: "Aucun utilisateur connecté" });
        }
    });
}