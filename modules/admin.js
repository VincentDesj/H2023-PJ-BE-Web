const config = require('./config.js');
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const validation = require('../Util/validation.js');
const cloudinary = require("cloudinary").v2;
const Multer = require("multer");
const { response } = require('../index.js');
const res = require('express/lib/response');
const cloudinaryUrl = require('cloudinary-build-url');

var conn = mysql.createConnection(config);

/** Cloudinary SETUP **/
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

/** Cloudinary UPLOAD METHOD **/
async function handleUpload(file) {
    const res = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
    });
    return res;
}

/** Cloudinary UPDATE METHOD **/
async function handleUpdate(file, url) {
    const publicId = cloudinaryUrl.extractPublicId(url);
    const res = await cloudinary.uploader.upload(file, {
        public_id: publicId,
        invalidate: true
    });
    return res;
}

/** Multer SETUP **/
const storage = new Multer.memoryStorage();
const upload = Multer({ storage, });


module.exports = function (app) {
    // app.get(AdminRole): Permet d'obtenir la liste des roles.
    app.get("/AdminRole", (req, res) => {
        if (validation.isSessionAdmin(req, res)) {
            let query = "SELECT * FROM role";
            conn.query(query, (err, result) => {
                if (err) { throw err; }
                console.log("Affichage des roles");
                res.send({ Role: result });
            })
        }
    })

    // app.get(/Admin) obtenir les infos sur les clients
    app.get('/Admin', (req, res) => {
        if (validation.isSessionAdmin(req, res)) {
            let query = "SELECT id_utilisateur, nom_utilisateur, prenom_utilisateur, courriel_utilisateur, telephone_utilisateur, type_role FROM utilisateur LEFT JOIN role ON utilisateur.id_role=role.id_role WHERE id_utilisateur NOT IN (?)";
            conn.query(query, req.session.user.id, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Affichage de tout les utilisateurs");
                    res.send({ Utilisateurs: result });
                }
            });
        }
    });

    // app.post(/Admin) creation compte utilisateur par l'administrateur/employe
    app.post('/Admin', (req, res) => {
        const nom = req.body.nom;
        const prenom = req.body.prenom;
        const motDePasse = req.body.motDePasse;
        const courriel = req.body.courriel;
        const telephone = req.body.telephone;
        const idRole = req.body.idRole;

        if (validation.isSessionAdmin(req, res)) {
            if (validation.courriel(courriel, res)) {
                let query = "Select courriel_utilisateur from utilisateur";
                conn.query(query, (errs, results) => {
                    if (errs) { throw errs; }

                    let courrielMinuscule = courriel.toLowerCase();
                    if (!validation.existenceCourriel(courrielMinuscule, results, res)) {
                        if (Object.keys(motDePasse).length > 5) {
                            bcrypt.hash(motDePasse, saltRounds, (error, hashedPwd) => {
                                if (error) {
                                    throw err;
                                }
                                let sql = "INSERT INTO utilisateur (nom_utilisateur, prenom_utilisateur, motDePasse_utilisateur, courriel_utilisateur, telephone_utilisateur, id_role) VALUES ?";
                                let utilisateur = [
                                    [nom, prenom, hashedPwd, courrielMinuscule, telephone, idRole]
                                ];
                                conn.query(sql, [utilisateur], (err, result) => {
                                    if (err) {
                                        throw err;
                                    } else {
                                        console.log("Utilisateur créer: " + result.affectedRows);
                                        res.send({ Utilisateurs: result.affectedRows });
                                    }
                                });
                            });
                        } else {
                            console.log("Mot de passe invalide, doit contenir au moins 6 caractères");
                            res.send({ message: "Mot de passe invalide, doit contenir au moins 6 caractères" });
                        }
                    }
                });
            }
        }
    });

    // app.put(/Admin) Permet de moddifier un utilisateur
    app.put('/Admin', (req, res) => {
        const idUtilisateur = req.body.idUtilisateur;
        const nom = req.body.nom;
        const prenom = req.body.prenom;
        const motDePasse = req.body.motDePasse;
        const courriel = req.body.courriel;
        const telephone = req.body.telephone;
        const idRole = req.body.idRole;

        if (validation.isSessionAdmin(req, res)) {
            if (Object.keys(courriel).length < 1) {
                if (Object.keys(motDePasse).length > 5) {
                    bcrypt.hash(motDePasse, saltRounds, (error, hashedPwd) => {
                        if (error) {
                            throw err;
                        }
                        let query = "CALL defaultdb.modificationUtilisateur(?)";
                        let utilisateur = [
                            [idUtilisateur, nom, prenom, hashedPwd, courriel, telephone, idRole]
                        ];
                        conn.query(query, utilisateur, (err, result) => {
                            if (err) {
                                throw err;
                            } else {
                                console.log("Modification de l'utilisateur avec mot de passe");
                                res.send({ Modification: result.affectedRows });
                            }
                        });
                    });
                } else {
                    let query = "CALL defaultdb.modificationUtilisateur(?)";
                    let utilisateur = [
                        [idUtilisateur, nom, prenom, '', courriel, telephone, idRole]
                    ];
                    conn.query(query, utilisateur, (err, result) => {
                        if (err) {
                            throw err;
                        } else {
                            console.log("Modification de l'utilisateur");
                            res.send({ Modification: result.affectedRows });
                        }
                    });
                }
            } else {
                let courrielMinuscule = courriel.toLowerCase();
                if (validation.courriel(courrielMinuscule, res)) {
                    if (Object.keys(motDePasse).length > 5) {
                        bcrypt.hash(motDePasse, saltRounds, (error, hashedPwd) => {
                            if (error) {
                                throw err;
                            }
                            let query = "CALL defaultdb.modificationUtilisateur(?)";
                            let utilisateur = [
                                [idUtilisateur, nom, prenom, hashedPwd, courrielMinuscule, telephone, idRole]
                            ];
                            conn.query(query, utilisateur, (err, result) => {
                                if (err) {
                                    throw err;
                                } else {
                                    console.log("Modification de l'utilisateur avec mot de passe");
                                    res.send({ Modification: result.affectedRows });
                                }
                            });
                        });
                    } else {
                        let query = "CALL defaultdb.modificationUtilisateur(?)";
                        let utilisateur = [
                            [idUtilisateur, nom, prenom, '', courrielMinuscule, telephone, idRole]
                        ];
                        conn.query(query, utilisateur, (err, result) => {
                            if (err) {
                                throw err;
                            } else {
                                console.log("Modification de l'utilisateur");
                                res.send({ Modification: result.affectedRows });
                            }
                        });
                    }
                }
            }
        }
    });

    // app.delete(/Admin) Permet a l'admin/employe de supprimer un utilisateur
    app.delete('/Admin', (req, res) => {
        const idUtilisateur = req.body.idUtilisateur;

        if (validation.isSessionAdmin(req, res)) {
            if (req.body.idUtilisateur !== req.session.user.id) {
                let query = "DELETE FROM utilisateur WHERE id_utilisateur = ?";
                conn.query(query, idUtilisateur, (err, result) => {
                    if (err) {
                        throw err;
                    } else {
                        console.log("Suppression de l'utilisateur, ligne affecté: " + result.affectedRows);
                        res.send({ Suppression: "Succes " + result.affectedRows });
                    }
                });
            }
        }
    });

    // app.get(/AdminCompagnie) Obtien toutes les compagnie de la base de données
    app.get('/AdminCompagnie', (req, res) => {
        if (validation.isSessionAdmin(req, res)) {
            let query = "SELECT * FROM compagnie";
            conn.query(query, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Affichage de tout les forfaits");
                    res.send({ Compagnies: result });
                }
            });
        }
    });

    // app.post(/AdminCompagnie) Ajoute une compagnie dans la base de donnnées
    app.post('/AdminCompagnie', (req, res) => {
        const idUtilisateur = req.body.idUtilisateur;
        const nom = req.body.nom;
        const adresse = req.body.adresse;
        const noRegistre = req.body.noRegistre;
        const courriel = req.body.courriel;
        const telephone = req.body.telephone;

        if (validation.isSessionAdmin(req, res)) {
            let courrielMinuscule = courriel.toLowerCase();
            if (validation.courriel(courriel, res)) {
                if (Object.keys(nom).length > 0 && noRegistre != null) {
                    let query1 = "SELECT noRegistre_compagnie FROM compagnie WHERE id_utilisateur = ?";
                    let compagnie = [
                        [nom, adresse, noRegistre, courrielMinuscule, telephone, idUtilisateur]
                    ];

                    conn.query(query1, idUtilisateur, (err, result) => {
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
                    })
                }
            }
        }
    });

    // app.put(/AdminCompagnie) Modifie une compagnie
    app.put('/AdminCompagnie', (req, res) => {
        const idUtilisateur = req.body.idUtilisateur;
        const idCompagnie = req.body.idCompagnie;
        const nom = req.body.nom;
        const adresse = req.body.adresse;
        const noRegistre = req.body.noRegistre;
        const courriel = req.body.courriel;
        const telephone = req.body.telephone;

        if (validation.isSessionAdmin(req, res)) {
            if (Object.keys(courriel).length < 1) {
                let query = "CALL defaultdb.modificationCompagnieAdmin(?)";
                let compagnie = [
                    [nom, adresse, noRegistre, courriel, telephone, idUtilisateur, idCompagnie]
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
                    let query = "CALL defaultdb.modificationCompagnieAdmin(?)";
                    let compagnie = [
                        [nom, adresse, noRegistre, courrielMinuscule, telephone, idUtilisateur, idCompagnie]
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

    // app.delete(/AdminCompagnie) Efface une compagnie
    app.delete("/AdminCompagnie", (req, res) => {
        const idCompagnie = req.body.idCompagnie;

        if (validation.isSessionAdmin(req, res)) {
            let query = "DELETE FROM compagnie WHERE id_compagnie = ?";
            conn.query(query, [idCompagnie], (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Suppression de la compagnie");
                    res.send({ Suppression: result.affectedRows });
                }
            });
        }
    });

    // app.get(/AdminForfait) Obtien tous les forfaits de la base de données
    app.get('/AdminForfait', (req, res) => {
        if (validation.isSessionAdmin(req, res)) {
            let query = "SELECT * FROM forfait";
            conn.query(query, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Affichage de tout les forfaits");
                    res.send({ Forfaits: result });
                }
            });
        }
    });

    // app.post(/AdminForfait) Ajoute un forfait à la base de données
    app.post("/AdminForfait", (req, res) => {
        const nom = req.body.nom;
        const type = req.body.type;
        const prix = req.body.prix;
        const description = req.body.description;

        if (validation.isSessionAdmin(req, res)) {
            let query = "INSERT INTO forfait (nom_forfait , type_forfait , prix_forfait , description_forfait) VALUES ?";
            let forfait = [
                [nom, type, prix, description]
            ];
            conn.query(query, [forfait], (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Ajout aux forfaits, ligne affecté: " + result.affectedRows);
                    res.send({ Forfait: "Forfait ajouté" });
                }
            });
        }
    });

    // app.put(/AdminForfait) Modifie un forfait dans la base de données
    app.put("/AdminForfait", (req, res) => {
        const idForfait = req.body.idForfait;
        const nom = req.body.nom;
        const type = req.body.type;
        const prix = req.body.prix;
        const description = req.body.description;

        if (validation.isSessionAdmin(req, res)) {
            let query = "CALL defaultdb.modificationForfait(?)";
            let forfait = [
                [idForfait, nom, type, prix, description]
            ];
            conn.query(query, forfait, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Modification aux forfaits, ligne affecté: " + result.affectedRows);
                    res.send({ Forfait: "Forfait Modifier" });
                }
            });
        }
    });

    // app.delete(/AdminForfait) Supprime le forfait dans la base de données
    app.delete("/AdminForfait", (req, res) => {
        const idForfait = req.body.idForfait

        if (validation.isSessionAdmin(req, res)) {
            let query = "DELETE FROM forfait WHERE id_forfait = ?";
            conn.query(query, idForfait, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Forfait supprimé, ligne affecté: " + result.affectedRows);
                    res.send({ Forfait: "Forfait supprimer avec succes" });
                }
            });
        }
    });

    // app.get(/AdminVideo) Reçois les vidéos de la base de données
    app.get('/AdminVideo', (req, res) => {
        if (validation.isSessionAdmin(req, res)) {
            let query = "SELECT * FROM video";
            conn.query(query, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Affichage de toutes les vidéos");
                    res.send({ Videos: result });
                }
            });
        }
    });

    // app.post(/AdminVideo) Ajoute une vidéo dans la base de données
    app.post("/AdminVideo", upload.any([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {

        const jsonFormData = JSON.parse(JSON.stringify(req.body));

        const titre = jsonFormData.titre;
        const description = jsonFormData.description;
        const idForfait = jsonFormData.idForfait;
        const imageUrl = await uploadFile(req.files[1], validation.isSessionAdmin(req, res)) ?? "";
        const videoUrl = await uploadFile(req.files[0], validation.isSessionAdmin(req, res)) ?? "";

        try {
            if (validation.isSessionAdmin(req, res)) {
                let query = "INSERT INTO video (titre_video, description_video, id_forfait, image_video, video_video) VALUES ?";
                let video = [
                    [titre, description, idForfait, imageUrl, videoUrl]
                ];
                conn.query(query, [video], (err, result) => {
                    if (err) {
                        throw err;
                    } else {
                        console.log("Ajout aux vidéos, ligne affecté: " + result.affectedRows);
                        res.send({ Video: "Vidéo ajouté" });
                    }
                });
            }
        } catch (error) {
            console.log(error);
            res.send({
                message: error.message,
            });
        }
    });

    // app.put(/AdminVideo) modifie une vidéo dans la base de données
    app.put("/AdminVideo", upload.any([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
        const jsonFormData = JSON.parse(JSON.stringify(req.body));

        const idVideo = jsonFormData.idVideo;
        const titre = jsonFormData.titre;
        const description = jsonFormData.description;
        const idForfait = jsonFormData.idForfait;
        const oldImageUrl = req.body.oldImageUrl;
        const oldVideoUrl = req.body.oldVideoUrl;

        console.log("dans /AdminVideo")

        let imageUrl = "";
        let videoUrl = "";

        if (validation.isSessionAdmin(req, res)) {
            if (req.files[0] != undefined) {
                imageUrl = await updateFile(req.files[0], oldImageUrl, validation.isSessionAdmin(req, res)) ?? "";
            }

            if (req.files[1] != undefined) {
                videoUrl = await updateFile(req.files[1], oldVideoUrl, validation.isSessionAdmin(req, res)) ?? "";
            }

            console.log(imageUrl)
            console.log(videoUrl)

            let query = "CALL defaultdb.modificationVideo(?)";
            let video = [
                [idVideo, titre, description, idForfait, imageUrl, videoUrl]
            ];
            conn.query(query, video, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Modification aux vidéos, ligne affecté: " + result.affectedRows);
                    res.send({ Video: "Vidéo Modifier" });
                }
            });
        }
    });

    // app.delete(/AdminVideo) supprime une vidéo dans la base de données
    app.delete("/AdminVideo", (req, res) => {
        const idVideo = req.body.idVideo;

        if (validation.isSessionAdmin(req, res)) {
            let query = "DELETE FROM video WHERE id_video = ?";
            conn.query(query, idVideo, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    console.log("Vidéo supprimé, ligne affecté: " + result.affectedRows);
                    res.send({ Video: "Vidéo supprimé avec succes: " + result.affectedRows });
                }
            });
        }
    });

    // Permet d'envoyer un fichier au serveur Cloudinary
    async function uploadFile(reqFile, isSessionAdmin) {
        let cldRes = null;
        try {
            if (isSessionAdmin) {
                const b64 = Buffer.from(reqFile.buffer).toString("base64");
                let dataURI = "data:" + reqFile.mimetype + ";base64," + b64;
                cldRes = await handleUpload(dataURI);
                console.log(cldRes)
                return cldRes.url;
            }
        } catch (error) {
            console.log("error : " + error);
            return null;
        }
    }

    // Permet de modifier un fichier au serveur Cloudinary
    async function updateFile(reqFile, url, isSessionAdmin) {
        console.log("dans updateFile")
        let cldRes = null;
        try {
            if (isSessionAdmin) {
                const b64 = Buffer.from(reqFile.buffer).toString("base64");
                let dataURI = "data:" + reqFile.mimetype + ";base64," + b64;
                cldRes = await handleUpdate(dataURI, url);
                console.log(cldRes.url);
                return cldRes.url;
            }
        } catch (error) {
            console.log("error : " + error);
            return null;
        }
    }
}