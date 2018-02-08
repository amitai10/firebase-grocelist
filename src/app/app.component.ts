import { Component, OnInit, ViewChild } from "@angular/core";
import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument
} from "angularfire2/firestore";
import { AngularFireAuth } from "angularfire2/auth";
import * as firebase from "firebase/app";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";

interface Grocery {
  name: string;
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  groceriesCol: AngularFirestoreCollection<any>;
  groceries: any;
  groceriesBankCol: AngularFirestoreCollection<any>;
  groceriesBankObs: Observable<any[]>;
  groceriesBank: any;

  name: string;
  @ViewChild("instance") instance: NgbTypeahead;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  search = (text$: Observable<string>) =>
    text$
      .debounceTime(200)
      .distinctUntilChanged()
      .merge(this.focus$)
      .merge(this.click$.filter(() => !this.instance.isPopupOpen()))
      .map(term =>
        (term === ""
          ? this.groceriesBank
          : this.groceriesBank.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)
        ).slice(0, 10)
      );

  constructor(private afs: AngularFirestore, public afAuth: AngularFireAuth) {}

  ngOnInit() {
    this.groceriesCol = this.afs.collection("groceries");
    this.groceries = this.groceriesCol.snapshotChanges().map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as Grocery;
        const id = a.payload.doc.id;
        return { id, data };
      });
    });

    this.groceriesBankCol = this.afs.collection("bank_of_groceries");
    this.groceriesBankObs = this.groceriesBankCol.snapshotChanges().map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as Grocery;
        const id = a.payload.doc.id;
        return { id, data };
      });
    });

    this.groceriesBankObs.subscribe(groceries => this.groceriesBank = groceries.map((g) => g.data.name));
  }

  addGrocery() {
    if (this.name) {
      this.afs.collection("groceries").add({ name: this.name });
    }
    this.name = "";
  }

  selectedItem(evt) {
    evt.preventDefault();
    if (evt.item) {
      this.afs.collection("groceries").add({ name: evt.item });
    }
    this.name = "";    
  }

  delete(grocery) {
    this.afs.doc("groceries/" + grocery.id).delete();
  }

  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
  logout() {
    this.afAuth.auth.signOut();
  }
}
