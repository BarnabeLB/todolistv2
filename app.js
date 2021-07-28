//jshint esversion:6

const express = require("express");
// const ejs = require("ejs");
// const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemsSchema = {
  name: {
    type: String,
    required: [true, "Please enter a name !"],
  },
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "carrot",
});
const item2 = new Item({
  name: "patatoes",
});
const item3 = new Item({
  name: "shampoo",
});

const defaultItems = [item1, item2, item3];

const listSchema = {                                                                   // création d'un nouveau Schema (objet JS)                          
  name: String,                                                                        //
  items: [itemsSchema],                                                                // dont la propriété item est un array fait avec un autre objet JS
};

const List = mongoose.model("List", listSchema);                                       // On engeristre la collection selon la schema et on lui donne un nom au singulier

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("items added successfully !");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:paramName", function (req, res) {                                            //
  const requestedListName = _.capitalize(req.params.paramName);                         // on capitalized et enregistre la string qui se trouve après les ":" dans une variable

  List.findOne({ name: requestedListName }, function (err, foundList) {                 // appel à la database selon la condition name et la valeur de la variable enregistré ci dessus
    if (!err) {
      if (!foundList) {                                                                 // Si aucune liste n'est trouvé :
        const list = new List({                                                         //                                on en crééer une selon (l.46) 
          name: requestedListName,
          items: defaultItems,
        });
        list.save();                                                                    //      Sauvegarde de la list dans la DB
        res.redirect("/" + requestedListName );                                         //       On affiche directement dans le navigateur la liste créée (permet de rejouer la fonction et de passer dans le else directement ?)
      } else {                                                                          // Si une liste est trouvée :
        res.render("list", {                                                            //       on l'affiche list.ejs avec les variables correspondantes.
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {                                                     //
  const itemName = req.body.newItem;                                                    // sauvegarde de la valeur de l'input dans une variable
  const listName = req.body.list;                                                       // sauvegarde de la valeur du bouton (qui est le titre de la liste)
  
  const item = new Item({                                                               //  création d'un nouvel élement dynamique de liste Item
    name: itemName,                                                                     //    dynamique car il prend le nom de l'input (l.88)
  });

  if(listName === "Today") {                                                            //  Si on est sur la liste originelle ( "Today")
    item.save();                                                                        //    on sauvegarde le nouvel élement
    res.redirect("/");                                                                  //    et on redirige vers la page originelle
  }else{                                                                                //  Sinon
    List.findOne({name : listName}, function(err, foundList){                           //    on cherche dans la database une liste correspondant au titre de la page, le résultat sera stocké dans foundList
        foundList.items.push(item);                                                     //    on enregistre le nouvel élément dans l'array foundList.items
        foundList.save();                                                               //    on sauvegarde la liste en question
        res.redirect("/" + listName);                                                   //    on redirige vers l'adresse de la liste éditée
      });
  }
});

app.post("/delete", function (req, res) {                                               //
  const checkedItemId = req.body.checkbox;                                              //  récupération et sauvegarde de l'id de chaque élément que l'user veut supprimer
  const listName = req.body.listName;                                                   //  récupération et sauvegarde du titre de la liste, grace à un 'hidden' input dans list.ejs

  if(listName === "Today") {                                                            //  Si on est sur la liste originelle
    Item.findByIdAndRemove({ _id: checkedItemId }, function (err) {                     //    on cherche dans la collection Item, et on supprime l'occurence qui match avec l'id récupéré
      if (err) {                                                                        //
        console.log(err);                                                               //
      } else {                                                                          //
        console.log("Successfully removed from list !");                                //
        res.redirect("/");                                                              //
      }                                                                               
    });
  }else{                                                                                //  Sinon c'est qu'on est sur une liste custom
    List.findOneAndUpdate({ name : listName},                                           //    alors on cherche dans la collection List, la liste qui match avec celle récupéré
      {$pull: {items: {_id: checkedItemId}}},                                           //    et on supprime ($pull (c'est du mongoDB)), dans un champ donné (ici l'array items), l'id voulue
       function (err, foundList) {                                                      //    le callback est nécéssaire pour effectuer l'opération même si on met rien dedans
      if (!err) {                                                                       //
        res.redirect("/" + listName);                                                   //    on renvoit sur la page de la liste éditée
      } 
    });
    
  }
 
  
});

// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
