// Verifie si le courriel est dans un format standard
let courriel = (courriel, res) => {
    const regexCourriel = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (courriel.match(regexCourriel)) {
        return true;
    } else {
        console.log("Le courriel n'est pas dans un format valide");
        res.send({ message: "Le courriel n'est pas dans un format valide" });
        return false;
    }
};

// Verifie si le courriel existe deja en BD
let existenceCourriel = (courriel, results, res) => {
    courrielExistant = false;

    results.forEach(r => {
        if (r.courriel_utilisateur === courriel) {
            console.log("Ce courriel existe déjà");
            res.send({ message: "Ce courriel existe déjà" });
            courrielExistant = true;
        }
    });

    return courrielExistant;
};

// Verifie si la session contient le role administrateur
let isSessionAdmin = (req, res) => {
    if (req.session.user) {
        if (req.session.user.role !== null) {
            return true;
        } else {
            console.log("L'utilisateur n'a pas de role attitré.");
            res.send({ message: "L'utilisateur n'a pas de role attitré." });
            return false;
        }
    } else {
        console.log("Aucun utilisateur connecté.");
        res.send({ message: "Aucun utilisateur connecté." });
        return false;
    }
};

let motDePasse = (string) => {
    const regexCourriel = /[a-z][A-Z][0-9]/; // a faire avec une vrai regex
    if (string.match(regexCourriel)) {
        return true;
    } else {
        res.send({ message: "Le mot de passe n'est pas dans un format valide" });
        return false;
    }
}

module.exports = { courriel, existenceCourriel, isSessionAdmin, motDePasse };