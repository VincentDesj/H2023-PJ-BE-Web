require("dotenv").config();
const express = require('express');
const config = require('./modules/config.js');
const validation = require('./Util/validation.js');
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const cors = require("cors");
const session = require("express-session");
const app = express();
const bodyParser = require('body-parser');
const svgCaptcha = require('svg-captcha');

var conn = mysql.createConnection(config);

app.use(bodyParser.json());

app.use(
    cors({
        origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:19006", "http://localhost:19000"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

app.use(
    session({
        key: "LaBambaTriste",
        resave: false,
        secret: "user",
        saveUninitialized: false,
        cookie: {
            maxAge: null
        },
    })
);

// Peut etre ajouter un peu partout conn.connect() suivi de conn.end() pour assurer l'ouverture et fermeture de la BD

// app.get(/login):
app.get('/login', (req, res) => {
    if (req.session.user) {
        res.send({ loggedIn: true, hasRole: req.session.user.role });
    } else {
        console.log("Aucun utilisateur connecté");
        res.send({ loggedIn: false, hasRole: null });
    }
});

// app.get(/captcha): obtien le code unique captcha pour se connecter
app.get('/captcha', (req, res) => {
    var captcha = svgCaptcha.create();
    req.session.captcha = captcha.text;

    res.type('svg');
    res.status(200).send(captcha.data);
});

// app.post(/login): Connection a la platforme
app.post('/login', (req, res) => {
    const courriel = req.body.courriel;
    const motDePasse = req.body.motDePasse;
    const captchaText = req.body.captcha;

    if (req.session.captcha === captchaText) {
        if (validation.courriel(courriel, res)) {
            conn.connect(function (err) {
                if (err) {
                    throw err;
                }

                let sql = 'SELECT * FROM utilisateur WHERE courriel_utilisateur =?';
                conn.query(sql, [courriel], function (error, resultat) {
                    if (error) {
                        throw error;
                    }

                    if (resultat.length > 0) {
                        bcrypt.compare(motDePasse, resultat[0].motDePasse_utilisateur, (error, response) => {
                            if (response) {
                                req.session.user = { id: resultat[0].id_utilisateur, role: resultat[0].id_role };
                                req.signedCookies
                                res.send({ Succes: "Connection Reussi", role: req.session.user.role });
                            } else {
                                res.send({ message: "Mauvais courriel ou mot de passe!" });
                            }
                        });
                    } else {
                        req.session.captcha
                        res.send({ message: "La combinaison utilisateur et mot de passe ne corespondent pas." });
                    }
                }
                );
            });
        }
    } else {
        res.send({ message: "Le Captcha n'est pas valide." });
    }
});

// app.post(/login): Connection a la platforme mobile
app.post('/login/mobile', (req, res) => {
    const courriel = req.body.courriel;
    const motDePasse = req.body.motDePasse;

    if (validation.courriel(courriel, res)) {
        conn.connect(function (err) {
            if (err) {
                throw err;
            }

            console.log('je suis bel et bien dans login');

            let sql = 'SELECT * FROM utilisateur WHERE courriel_utilisateur =?';
            conn.query(sql, [courriel], function (error, resultat) {
                if (error) {
                    throw error;
                }

                console.log(resultat)

                if (resultat.length > 0) {
                    bcrypt.compare(motDePasse, resultat[0].motDePasse_utilisateur, (error, response) => {
                        if (response) {
                            req.session.user = { id: resultat[0].id_utilisateur, role: resultat[0].id_role };
                            req.signedCookies
                            res.send({ Succes: "Connection Reussi", id: req.session.user.id, role: req.session.user.role });
                        } else {
                            res.send({ message: "Mauvais courriel ou mot de passe!" });
                        }
                    });
                } else {
                    res.send({ message: "La combinaison utilisateur et mot de passe ne corespondent pas." });
                }
            }
            );
        });
    }
});

// app.post(/inscription): Ajout d'un utilisateur
app.post('/homeInscription', (req, res) => {
    const nom = req.body.nom;
    const prenom = req.body.prenom;
    const motDePasse = req.body.motDePasse;
    const courriel = req.body.courriel;

    if (validation.courriel(courriel, res)) {
        if (Object.keys(nom).length > 2 && Object.keys(prenom).length > 2 && Object.keys(motDePasse).length > 5) {
            let query = "Select courriel_utilisateur from utilisateur";
            conn.query(query, (errs, results) => {
                if (errs) {
                    throw errs;
                }
                let courrielMinuscule = courriel.toLowerCase();

                if (!validation.existenceCourriel(courrielMinuscule, results, res)) {
                    bcrypt.hash(motDePasse, saltRounds, (err, hashedPwd) => {
                        if (err) {
                            console.log(err);
                        }

                        let sql = "INSERT INTO utilisateur (nom_utilisateur, prenom_utilisateur, motDePasse_utilisateur, courriel_utilisateur) VALUES ?";

                        let utilisateur = [
                            [nom, prenom, hashedPwd, courrielMinuscule]
                        ];
                        conn.query(sql, [utilisateur], (err, result) => {
                            if (err) {
                                throw err;
                            } else {
                                console.log("succes d'inscription, champs affecté" + result.affectedRows);
                                res.send({ Inscription: "Succès" });
                            }
                        });
                    });
                }
            });
        } else {
            res.send({ message: "Un des champs n'est pas correct!" })
        }
    }
});

// app.get(decconection) permet de se deconnecter et fermer la session
app.get('/deconnection', (req, res) => {
    if (req.session.user) {
        console.log("deconnection reussi");
        req.session.user = null;
        res.send({ loggedIn: false, Deconnection: "Success" });
    } else {
        console.log("Aucune session active, deconnection impossible");
        res.send({ message: "Aucune session active, deconnection impossible" });
    }
});

// app.get(/achatForfaits) aller chercher les forfaits non acheter
app.get('/achatForfaits', (req, res) => {
    if (req.session.user) {
        let query = "CALL defaultdb.getAchatForfait(?)";
        conn.query(query, req.session.user.id, (err, result) => {
            if (err) {
                throw err;
            } else {
                console.log("Affichage des forfaits");
                res.send({ Forfaits: result[0] });
            }
        });
    } else {
        // Tout les forfaits pour non connecter.
        let query = "Select nom_forfait AS ID, type_forfait AS Nom, prix_forfait as Prix, description_forfait AS Description FROM forfait"
        conn.query(query, (err, result) => {
            if (err) {
                throw err;
            }
            res.send({ Forfaits: result });
        })
    }
});

// app.post(/achatForfaits) ajout de forfait au compte utilisateur
app.post("/achatForfaits", (req, res) => {
    const idForfait = req.body.idForfait;

    if (req.session.user) {
        let query = "INSERT INTO achat (id_utilisateur, id_forfait) VALUES ?";
        let ids = [
            [req.session.user.id, idForfait]
        ]
        conn.query(query, [ids], (err, result) => {
            if (err) {
                throw err;
            } else {
                console.log("Ajout du forfait a l'utilisateur: ligne affecté: " + result.affectedRows);
                res.send({ achatForfait: "Ajout du forfait a l'utilisateur" });
            }
        });
    } else {
        console.log("Aucune connection en cours pour effectuer un achat");
        res.send({ message: "Aucune connection pour effectuer un achat" });
    }
});

// app.get(/Video): recois toutes les videos avec leurs titres et leurs thumbnails
app.get('/videos', (req, res) => {
    if (req.session.user) {
        conn.query("CALL defaultdb.getVideos(?)", req.session.user.id, (err, result) => {
            if (err) { throw err; }
            else {
                console.log("Affichage des vidéos");
                res.send({ videos: result[0] });
            }
        });
    } else {
        console.log("Aucun utilisateur connecté pour voir les videos disponibles");
        res.send({ message: "Aucune connection en cours" });
    }
});

require('./modules/profil.js')(app);

require('./modules/admin.js')(app);

require('./modules/killometrage.js')(app);

var serveur = app.listen(3001, () => {
    console.log("running serveur");
    var port = serveur.address().port;
    console.log("Écoute à http://localhost:%s", port);
});

module.exports = app;