import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlayerCard } from "./PlayerCard";
import { drawCard, tenGacha } from "./gacha";
import { getCardById as getLegacyCardById } from "./cards";
import { db } from "../firebase";
import { onValue, ref, set } from "firebase/database";

const GOLD = "#C9A227";
const CREAM = "#F5EFE0";
const BG = "#17110E";
const PANEL = "#24201C";
const PANEL_SOFT = "#2A2520";
const SOFT = PANEL_SOFT;
const SINGLE_COST = 20;
const TEN_COST = 200;
const INITIAL_COINS = 0;
const FIRST_DAY_COINS = 400;
const DAILY_COINS = 200;
const MAX_SQUAD = 11;

const REAL_PLAYER_POOL = [
  {"id": "real_001", "name": "Alisson Becker", "position": "GK", "overall": 90, "awareness": 90, "catching": 91, "reflexes": 92, "diving": 91, "jumping": 88, "physical": 89, "pace": 75, "shooting": 25, "passing": 82, "dribbling": 72, "defending": 70, "rarity": "Epic"},
  {"id": "real_002", "name": "Ederson", "position": "GK", "overall": 84, "awareness": 84, "catching": 85, "reflexes": 86, "diving": 85, "jumping": 82, "physical": 83, "pace": 69, "shooting": 25, "passing": 76, "dribbling": 66, "defending": 64, "rarity": "Rare"},
  {"id": "real_003", "name": "Emiliano Martínez", "position": "GK", "overall": 79, "awareness": 79, "catching": 80, "reflexes": 81, "diving": 80, "jumping": 77, "physical": 78, "pace": 64, "shooting": 25, "passing": 71, "dribbling": 61, "defending": 59, "rarity": "Standard"},
  {"id": "real_004", "name": "Thibaut Courtois", "position": "GK", "overall": 90, "awareness": 90, "catching": 91, "reflexes": 92, "diving": 91, "jumping": 88, "physical": 89, "pace": 75, "shooting": 25, "passing": 82, "dribbling": 72, "defending": 70, "rarity": "Epic"},
  {"id": "real_005", "name": "Jan Oblak", "position": "GK", "overall": 91, "awareness": 91, "catching": 92, "reflexes": 93, "diving": 92, "jumping": 89, "physical": 90, "pace": 76, "shooting": 25, "passing": 83, "dribbling": 73, "defending": 71, "rarity": "Epic"},
  {"id": "real_006", "name": "Marc-André ter Stegen", "position": "GK", "overall": 86, "awareness": 86, "catching": 87, "reflexes": 88, "diving": 87, "jumping": 84, "physical": 85, "pace": 71, "shooting": 25, "passing": 78, "dribbling": 68, "defending": 66, "rarity": "Rare"},
  {"id": "real_007", "name": "Manuel Neuer", "position": "GK", "overall": 81, "awareness": 81, "catching": 82, "reflexes": 83, "diving": 82, "jumping": 79, "physical": 80, "pace": 66, "shooting": 25, "passing": 73, "dribbling": 63, "defending": 61, "rarity": "Rare"},
  {"id": "real_008", "name": "Mike Maignan", "position": "GK", "overall": 76, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "physical": 75, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 56, "rarity": "Standard"},
  {"id": "real_009", "name": "Gianluigi Donnarumma", "position": "GK", "overall": 93, "awareness": 93, "catching": 94, "reflexes": 95, "diving": 94, "jumping": 91, "physical": 92, "pace": 78, "shooting": 25, "passing": 85, "dribbling": 75, "defending": 73, "rarity": "Epic"},
  {"id": "real_010", "name": "David Raya", "position": "GK", "overall": 88, "awareness": 88, "catching": 89, "reflexes": 90, "diving": 89, "jumping": 86, "physical": 87, "pace": 73, "shooting": 25, "passing": 80, "dribbling": 70, "defending": 68, "rarity": "Epic"},
  {"id": "real_011", "name": "Jordan Pickford", "position": "GK", "overall": 83, "awareness": 83, "catching": 84, "reflexes": 85, "diving": 84, "jumping": 81, "physical": 82, "pace": 68, "shooting": 25, "passing": 75, "dribbling": 65, "defending": 63, "rarity": "Rare"},
  {"id": "real_012", "name": "Diogo Costa", "position": "GK", "overall": 78, "awareness": 78, "catching": 79, "reflexes": 80, "diving": 79, "jumping": 76, "physical": 77, "pace": 63, "shooting": 25, "passing": 70, "dribbling": 60, "defending": 58, "rarity": "Standard"},
  {"id": "real_013", "name": "Gregor Kobel", "position": "GK", "overall": 73, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "physical": 72, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 53, "rarity": "Standard"},
  {"id": "real_014", "name": "Yann Sommer", "position": "GK", "overall": 90, "awareness": 90, "catching": 91, "reflexes": 92, "diving": 91, "jumping": 88, "physical": 89, "pace": 75, "shooting": 25, "passing": 82, "dribbling": 72, "defending": 70, "rarity": "Epic"},
  {"id": "real_015", "name": "André Onana", "position": "GK", "overall": 85, "awareness": 85, "catching": 86, "reflexes": 87, "diving": 86, "jumping": 83, "physical": 84, "pace": 70, "shooting": 25, "passing": 77, "dribbling": 67, "defending": 65, "rarity": "Rare"},
  {"id": "real_016", "name": "Unai Simón", "position": "GK", "overall": 80, "awareness": 80, "catching": 81, "reflexes": 82, "diving": 81, "jumping": 78, "physical": 79, "pace": 65, "shooting": 25, "passing": 72, "dribbling": 62, "defending": 60, "rarity": "Rare"},
  {"id": "real_017", "name": "Robert Sánchez", "position": "GK", "overall": 75, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "physical": 74, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 55, "rarity": "Standard"},
  {"id": "real_018", "name": "Kepa Arrizabalaga", "position": "GK", "overall": 92, "awareness": 92, "catching": 93, "reflexes": 94, "diving": 93, "jumping": 90, "physical": 91, "pace": 77, "shooting": 25, "passing": 84, "dribbling": 74, "defending": 72, "rarity": "Epic"},
  {"id": "real_019", "name": "Aaron Ramsdale", "position": "GK", "overall": 87, "awareness": 87, "catching": 88, "reflexes": 89, "diving": 88, "jumping": 85, "physical": 86, "pace": 72, "shooting": 25, "passing": 79, "dribbling": 69, "defending": 67, "rarity": "Epic"},
  {"id": "real_020", "name": "Neto", "position": "GK", "overall": 82, "awareness": 82, "catching": 83, "reflexes": 84, "diving": 83, "jumping": 80, "physical": 81, "pace": 67, "shooting": 25, "passing": 74, "dribbling": 64, "defending": 62, "rarity": "Rare"},
  {"id": "real_021", "name": "Wojciech Szczęsny", "position": "GK", "overall": 77, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "physical": 76, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 57, "rarity": "Standard"},
  {"id": "real_022", "name": "Hugo Lloris", "position": "GK", "overall": 72, "awareness": 72, "catching": 73, "reflexes": 74, "diving": 73, "jumping": 70, "physical": 71, "pace": 57, "shooting": 25, "passing": 64, "dribbling": 54, "defending": 52, "rarity": "Standard"},
  {"id": "real_023", "name": "Keylor Navas", "position": "GK", "overall": 89, "awareness": 89, "catching": 90, "reflexes": 91, "diving": 90, "jumping": 87, "physical": 88, "pace": 74, "shooting": 25, "passing": 81, "dribbling": 71, "defending": 69, "rarity": "Epic"},
  {"id": "real_024", "name": "Edouard Mendy", "position": "GK", "overall": 84, "awareness": 84, "catching": 85, "reflexes": 86, "diving": 85, "jumping": 82, "physical": 83, "pace": 69, "shooting": 25, "passing": 76, "dribbling": 66, "defending": 64, "rarity": "Rare"},
  {"id": "real_025", "name": "Yassine Bounou", "position": "GK", "overall": 79, "awareness": 79, "catching": 80, "reflexes": 81, "diving": 80, "jumping": 77, "physical": 78, "pace": 64, "shooting": 25, "passing": 71, "dribbling": 61, "defending": 59, "rarity": "Rare"},
  {"id": "real_026", "name": "Andre Blake", "position": "GK", "overall": 74, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "physical": 73, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 54, "rarity": "Standard"},
  {"id": "real_027", "name": "Matt Turner", "position": "GK", "overall": 91, "awareness": 91, "catching": 92, "reflexes": 93, "diving": 92, "jumping": 89, "physical": 90, "pace": 76, "shooting": 25, "passing": 83, "dribbling": 73, "defending": 71, "rarity": "Epic"},
  {"id": "real_028", "name": "Nick Pope", "position": "GK", "overall": 86, "awareness": 86, "catching": 87, "reflexes": 88, "diving": 87, "jumping": 84, "physical": 85, "pace": 71, "shooting": 25, "passing": 78, "dribbling": 68, "defending": 66, "rarity": "Rare"},
  {"id": "real_029", "name": "Dean Henderson", "position": "GK", "overall": 81, "awareness": 81, "catching": 82, "reflexes": 83, "diving": 82, "jumping": 79, "physical": 80, "pace": 66, "shooting": 25, "passing": 73, "dribbling": 63, "defending": 61, "rarity": "Rare"},
  {"id": "real_030", "name": "Bart Verbruggen", "position": "GK", "overall": 76, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "physical": 75, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 56, "rarity": "Standard"},
  {"id": "real_031", "name": "David de Gea", "position": "GK", "overall": 93, "awareness": 93, "catching": 94, "reflexes": 95, "diving": 94, "jumping": 91, "physical": 92, "pace": 78, "shooting": 25, "passing": 85, "dribbling": 75, "defending": 73, "rarity": "Epic"},
  {"id": "real_032", "name": "Pepe Reina", "position": "GK", "overall": 88, "awareness": 88, "catching": 89, "reflexes": 90, "diving": 89, "jumping": 86, "physical": 87, "pace": 73, "shooting": 25, "passing": 80, "dribbling": 70, "defending": 68, "rarity": "Epic"},
  {"id": "real_033", "name": "Claudio Bravo", "position": "GK", "overall": 83, "awareness": 83, "catching": 84, "reflexes": 85, "diving": 84, "jumping": 81, "physical": 82, "pace": 68, "shooting": 25, "passing": 75, "dribbling": 65, "defending": 63, "rarity": "Rare"},
  {"id": "real_034", "name": "Samir Handanović", "position": "GK", "overall": 78, "awareness": 78, "catching": 79, "reflexes": 80, "diving": 79, "jumping": 76, "physical": 77, "pace": 63, "shooting": 25, "passing": 70, "dribbling": 60, "defending": 58, "rarity": "Standard"},
  {"id": "real_035", "name": "Salvatore Sirigu", "position": "GK", "overall": 73, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "physical": 72, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 53, "rarity": "Standard"},
  {"id": "real_036", "name": "Gianluigi Buffon", "position": "GK", "overall": 96, "awareness": 97, "catching": 92, "reflexes": 94, "diving": 95, "jumping": 88, "physical": 80, "pace": 64, "shooting": 25, "passing": 82, "dribbling": 72, "defending": 70, "rarity": "Legendary","photo": "/players/buffon.png"},
  {"id": "real_037", "name": "Iker Casillas", "position": "GK", "overall": 95, "awareness": 93, "catching": 91, "reflexes": 95, "diving": 90, "jumping": 83, "physical": 79, "pace": 70, "shooting": 25, "passing": 77, "dribbling": 67, "defending": 65, "rarity": "Legendary"},
  {"id": "real_038", "name": "Petr Čech", "position": "GK", "overall": 80, "awareness": 80, "catching": 81, "reflexes": 82, "diving": 81, "jumping": 78, "physical": 79, "pace": 65, "shooting": 25, "passing": 72, "dribbling": 62, "defending": 60, "rarity": "Rare"},
  {"id": "real_039", "name": "Oliver Kahn", "position": "GK", "overall": 75, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "physical": 74, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 55, "rarity": "Standard"},
  {"id": "real_040", "name": "Peter Schmeichel", "position": "GK", "overall": 95, "awareness": 92, "catching": 93, "reflexes": 94, "diving": 93, "jumping": 90, "physical": 82, "pace": 77, "shooting": 25, "passing": 84, "dribbling": 74, "defending": 72, "rarity": "Legendary"},
  {"id": "real_041", "name": "Edwin van der Sar", "position": "GK", "overall": 87, "awareness": 87, "catching": 88, "reflexes": 89, "diving": 88, "jumping": 85, "physical": 86, "pace": 72, "shooting": 25, "passing": 79, "dribbling": 69, "defending": 67, "rarity": "Epic"},
  {"id": "real_042", "name": "Fabien Barthez", "position": "GK", "overall": 82, "awareness": 82, "catching": 83, "reflexes": 84, "diving": 83, "jumping": 80, "physical": 81, "pace": 67, "shooting": 25, "passing": 74, "dribbling": 64, "defending": 62, "rarity": "Rare"},
  {"id": "real_043", "name": "Dida", "position": "GK", "overall": 77, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "physical": 76, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 57, "rarity": "Standard"},
  {"id": "real_044", "name": "Julio César", "position": "GK", "overall": 72, "awareness": 72, "catching": 73, "reflexes": 74, "diving": 73, "jumping": 70, "physical": 71, "pace": 57, "shooting": 25, "passing": 64, "dribbling": 54, "defending": 52, "rarity": "Standard"},
  {"id": "real_045", "name": "Victor Valdés", "position": "GK", "overall": 89, "awareness": 89, "catching": 90, "reflexes": 91, "diving": 90, "jumping": 87, "physical": 88, "pace": 74, "shooting": 25, "passing": 81, "dribbling": 71, "defending": 69, "rarity": "Epic"},
  {"id": "real_046", "name": "Marcelo Grohe", "position": "GK", "overall": 84, "awareness": 84, "catching": 85, "reflexes": 86, "diving": 85, "jumping": 82, "physical": 83, "pace": 69, "shooting": 25, "passing": 76, "dribbling": 66, "defending": 64, "rarity": "Rare"},
  {"id": "real_047", "name": "Weverton", "position": "GK", "overall": 79, "awareness": 79, "catching": 80, "reflexes": 81, "diving": 80, "jumping": 77, "physical": 78, "pace": 64, "shooting": 25, "passing": 71, "dribbling": 61, "defending": 59, "rarity": "Rare"},
  {"id": "real_048", "name": "Cássio", "position": "GK", "overall": 74, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "physical": 73, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 54, "rarity": "Standard"},
  {"id": "real_049", "name": "Éverson", "position": "GK", "overall": 91, "awareness": 91, "catching": 92, "reflexes": 93, "diving": 92, "jumping": 89, "physical": 90, "pace": 76, "shooting": 25, "passing": 83, "dribbling": 73, "defending": 71, "rarity": "Epic"},
  {"id": "real_050", "name": "Agustín Marchesín", "position": "GK", "overall": 86, "awareness": 86, "catching": 87, "reflexes": 88, "diving": 87, "jumping": 84, "physical": 85, "pace": 71, "shooting": 25, "passing": 78, "dribbling": 68, "defending": 66, "rarity": "Rare"},
  {"id": "real_051", "name": "Franco Armani", "position": "GK", "overall": 81, "awareness": 81, "catching": 82, "reflexes": 83, "diving": 82, "jumping": 79, "physical": 80, "pace": 66, "shooting": 25, "passing": 73, "dribbling": 63, "defending": 61, "rarity": "Rare"},
  {"id": "real_052", "name": "Guillermo Ochoa", "position": "GK", "overall": 76, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "physical": 75, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 56, "rarity": "Standard"},
  {"id": "real_053", "name": "Carlos Acevedo", "position": "GK", "overall": 93, "awareness": 93, "catching": 94, "reflexes": 95, "diving": 94, "jumping": 91, "physical": 92, "pace": 78, "shooting": 25, "passing": 85, "dribbling": 75, "defending": 73, "rarity": "Epic"},
  {"id": "real_054", "name": "Ronwen Williams", "position": "GK", "overall": 88, "awareness": 88, "catching": 89, "reflexes": 90, "diving": 89, "jumping": 86, "physical": 87, "pace": 73, "shooting": 25, "passing": 80, "dribbling": 70, "defending": 68, "rarity": "Epic"},
  {"id": "real_055", "name": "Kim Seung-gyu", "position": "GK", "overall": 83, "awareness": 83, "catching": 84, "reflexes": 85, "diving": 84, "jumping": 81, "physical": 82, "pace": 68, "shooting": 25, "passing": 75, "dribbling": 65, "defending": 63, "rarity": "Rare"},
  {"id": "real_056", "name": "Lucas Chevalier", "position": "GK", "overall": 78, "awareness": 78, "catching": 79, "reflexes": 80, "diving": 79, "jumping": 76, "physical": 77, "pace": 63, "shooting": 25, "passing": 70, "dribbling": 60, "defending": 58, "rarity": "Standard"},
  {"id": "real_057", "name": "Illan Meslier", "position": "GK", "overall": 73, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "physical": 72, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 53, "rarity": "Standard"},
  {"id": "real_058", "name": "Lucas Perri", "position": "GK", "overall": 90, "awareness": 90, "catching": 91, "reflexes": 92, "diving": 91, "jumping": 88, "physical": 89, "pace": 75, "shooting": 25, "passing": 82, "dribbling": 72, "defending": 70, "rarity": "Epic"},
  {"id": "real_059", "name": "Anatoliy Trubin", "position": "GK", "overall": 85, "awareness": 85, "catching": 86, "reflexes": 87, "diving": 86, "jumping": 83, "physical": 84, "pace": 70, "shooting": 25, "passing": 77, "dribbling": 67, "defending": 65, "rarity": "Rare"},
  {"id": "real_060", "name": "Andriy Lunin", "position": "GK", "overall": 80, "awareness": 80, "catching": 81, "reflexes": 82, "diving": 81, "jumping": 78, "physical": 79, "pace": 65, "shooting": 25, "passing": 72, "dribbling": 62, "defending": 60, "rarity": "Rare"},
  {"id": "real_061", "name": "Arnau Tenas", "position": "GK", "overall": 75, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "physical": 74, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 55, "rarity": "Standard"},
  {"id": "real_062", "name": "Álex Remiro", "position": "GK", "overall": 92, "awareness": 92, "catching": 93, "reflexes": 94, "diving": 93, "jumping": 90, "physical": 91, "pace": 77, "shooting": 25, "passing": 84, "dribbling": 74, "defending": 72, "rarity": "Epic"},
  {"id": "real_063", "name": "Karl Hein", "position": "GK", "overall": 87, "awareness": 87, "catching": 88, "reflexes": 89, "diving": 88, "jumping": 85, "physical": 86, "pace": 72, "shooting": 25, "passing": 79, "dribbling": 69, "defending": 67, "rarity": "Epic"},
  {"id": "real_064", "name": "Gavin Bazunu", "position": "GK", "overall": 82, "awareness": 82, "catching": 83, "reflexes": 84, "diving": 83, "jumping": 80, "physical": 81, "pace": 67, "shooting": 25, "passing": 74, "dribbling": 64, "defending": 62, "rarity": "Rare"},
  {"id": "real_065", "name": "Caoimhin Kelleher", "position": "GK", "overall": 77, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "physical": 76, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 57, "rarity": "Standard"},
  {"id": "real_066", "name": "James Trafford", "position": "GK", "overall": 72, "awareness": 72, "catching": 73, "reflexes": 74, "diving": 73, "jumping": 70, "physical": 71, "pace": 57, "shooting": 25, "passing": 64, "dribbling": 54, "defending": 52, "rarity": "Standard"},
  {"id": "real_067", "name": "Nick Wolters", "position": "GK", "overall": 89, "awareness": 89, "catching": 90, "reflexes": 91, "diving": 90, "jumping": 87, "physical": 88, "pace": 74, "shooting": 25, "passing": 81, "dribbling": 71, "defending": 69, "rarity": "Epic"},
  {"id": "real_068", "name": "José Sá", "position": "GK", "overall": 84, "awareness": 84, "catching": 85, "reflexes": 86, "diving": 85, "jumping": 82, "physical": 83, "pace": 69, "shooting": 25, "passing": 76, "dribbling": 66, "defending": 64, "rarity": "Rare"},
  {"id": "real_069", "name": "Rui Patrício", "position": "GK", "overall": 79, "awareness": 79, "catching": 80, "reflexes": 81, "diving": 80, "jumping": 77, "physical": 78, "pace": 64, "shooting": 25, "passing": 71, "dribbling": 61, "defending": 59, "rarity": "Rare"},
  {"id": "real_070", "name": "Anthony Lopes", "position": "GK", "overall": 74, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "physical": 73, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 54, "rarity": "Standard"},
  {"id": "real_071", "name": "Benjamin Siegrist", "position": "GK", "overall": 91, "awareness": 91, "catching": 92, "reflexes": 93, "diving": 92, "jumping": 89, "physical": 90, "pace": 76, "shooting": 25, "passing": 83, "dribbling": 73, "defending": 71, "rarity": "Epic"},
  {"id": "real_072", "name": "Freddie Woodman", "position": "GK", "overall": 86, "awareness": 86, "catching": 87, "reflexes": 88, "diving": 87, "jumping": 84, "physical": 85, "pace": 71, "shooting": 25, "passing": 78, "dribbling": 68, "defending": 66, "rarity": "Rare"},
  {"id": "real_073", "name": "Angus Gunn", "position": "GK", "overall": 81, "awareness": 81, "catching": 82, "reflexes": 83, "diving": 82, "jumping": 79, "physical": 80, "pace": 66, "shooting": 25, "passing": 73, "dribbling": 63, "defending": 61, "rarity": "Rare"},
  {"id": "real_074", "name": "Jason Steele", "position": "GK", "overall": 76, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "physical": 75, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 56, "rarity": "Standard"},
  {"id": "real_075", "name": "Tom Heaton", "position": "GK", "overall": 93, "awareness": 93, "catching": 94, "reflexes": 95, "diving": 94, "jumping": 91, "physical": 92, "pace": 78, "shooting": 25, "passing": 85, "dribbling": 75, "defending": 73, "rarity": "Epic"},
  {"id": "real_076", "name": "Wayne Hennessey", "position": "GK", "overall": 88, "awareness": 88, "catching": 89, "reflexes": 90, "diving": 89, "jumping": 86, "physical": 87, "pace": 73, "shooting": 25, "passing": 80, "dribbling": 70, "defending": 68, "rarity": "Epic"},
  {"id": "real_077", "name": "Danny Ward", "position": "GK", "overall": 83, "awareness": 83, "catching": 84, "reflexes": 85, "diving": 84, "jumping": 81, "physical": 82, "pace": 68, "shooting": 25, "passing": 75, "dribbling": 65, "defending": 63, "rarity": "Rare"},
  {"id": "real_078", "name": "Brad Guzan", "position": "GK", "overall": 78, "awareness": 78, "catching": 79, "reflexes": 80, "diving": 79, "jumping": 76, "physical": 77, "pace": 63, "shooting": 25, "passing": 70, "dribbling": 60, "defending": 58, "rarity": "Standard"},
  {"id": "real_079", "name": "Tim Howard", "position": "GK", "overall": 73, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "physical": 72, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 53, "rarity": "Standard"},
  {"id": "real_080", "name": "Brad Friedel", "position": "GK", "overall": 90, "awareness": 90, "catching": 91, "reflexes": 92, "diving": 91, "jumping": 88, "physical": 89, "pace": 75, "shooting": 25, "passing": 82, "dribbling": 72, "defending": 70, "rarity": "Epic"},
  {"id": "real_081", "name": "Clint Dempsey", "position": "GK", "overall": 85, "awareness": 85, "catching": 86, "reflexes": 87, "diving": 86, "jumping": 83, "physical": 84, "pace": 70, "shooting": 25, "passing": 77, "dribbling": 67, "defending": 65, "rarity": "Rare"},
  {"id": "real_082", "name": "Joe Hart", "position": "GK", "overall": 80, "awareness": 80, "catching": 81, "reflexes": 82, "diving": 81, "jumping": 78, "physical": 79, "pace": 65, "shooting": 25, "passing": 72, "dribbling": 62, "defending": 60, "rarity": "Rare"},
  {"id": "real_083", "name": "Fraser Forster", "position": "GK", "overall": 75, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "physical": 74, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 55, "rarity": "Standard"},
  {"id": "real_084", "name": "Nick Hammond", "position": "GK", "overall": 92, "awareness": 92, "catching": 93, "reflexes": 94, "diving": 93, "jumping": 90, "physical": 91, "pace": 77, "shooting": 25, "passing": 84, "dribbling": 74, "defending": 72, "rarity": "Epic"},
  {"id": "real_085", "name": "Mathew Ryan", "position": "GK", "overall": 87, "awareness": 87, "catching": 88, "reflexes": 89, "diving": 88, "jumping": 85, "physical": 86, "pace": 72, "shooting": 25, "passing": 79, "dribbling": 69, "defending": 67, "rarity": "Epic"},
  {"id": "real_086", "name": "Andrew Redmayne", "position": "GK", "overall": 82, "awareness": 82, "catching": 83, "reflexes": 84, "diving": 83, "jumping": 80, "physical": 81, "pace": 67, "shooting": 25, "passing": 74, "dribbling": 64, "defending": 62, "rarity": "Rare"},
  {"id": "real_087", "name": "Mathew Turner", "position": "GK", "overall": 77, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "physical": 76, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 57, "rarity": "Standard"},
  {"id": "real_088", "name": "Matías Dituro", "position": "GK", "overall": 72, "awareness": 72, "catching": 73, "reflexes": 74, "diving": 73, "jumping": 70, "physical": 71, "pace": 57, "shooting": 25, "passing": 64, "dribbling": 54, "defending": 52, "rarity": "Standard"},
  {"id": "real_089", "name": "Esteban Andrada", "position": "GK", "overall": 89, "awareness": 89, "catching": 90, "reflexes": 91, "diving": 90, "jumping": 87, "physical": 88, "pace": 74, "shooting": 25, "passing": 81, "dribbling": 71, "defending": 69, "rarity": "Epic"},
  {"id": "real_090", "name": "Pedro Gallese", "position": "GK", "overall": 84, "awareness": 84, "catching": 85, "reflexes": 86, "diving": 85, "jumping": 82, "physical": 83, "pace": 69, "shooting": 25, "passing": 76, "dribbling": 66, "defending": 64, "rarity": "Rare"},
  {"id": "real_091", "name": "José Luis Chilavert", "position": "GK", "overall": 79, "awareness": 79, "catching": 80, "reflexes": 81, "diving": 80, "jumping": 77, "physical": 78, "pace": 64, "shooting": 25, "passing": 71, "dribbling": 61, "defending": 59, "rarity": "Standard"},
  {"id": "real_092", "name": "René Higuita", "position": "GK", "overall": 74, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "physical": 73, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 54, "rarity": "Standard"},
  {"id": "real_093", "name": "Óscar Córdoba", "position": "GK", "overall": 91, "awareness": 91, "catching": 92, "reflexes": 93, "diving": 92, "jumping": 89, "physical": 90, "pace": 76, "shooting": 25, "passing": 83, "dribbling": 73, "defending": 71, "rarity": "Epic"},
  {"id": "real_094", "name": "Virgil van Dijk", "position": "CB", "overall": 90, "pace": 84, "shooting": 82, "passing": 80, "dribbling": 84, "defending": 92, "physical": 90, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 60, "rarity": "Epic","photo": "/players/virgil.png"},
  {"id": "real_095", "name": "William Saliba", "position": "CB", "overall": 81, "pace": 72, "shooting": 68, "passing": 76, "dribbling": 73, "defending": 80, "physical": 76, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_096", "name": "Antonio Rüdiger", "position": "CB", "overall": 76, "pace": 76, "shooting": 72, "passing": 76, "dribbling": 66, "defending": 64, "physical": 73, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_097", "name": "Alessandro Bastoni", "position": "CB", "overall": 93, "pace": 90, "shooting": 84, "passing": 86, "dribbling": 81, "defending": 88, "physical": 92, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_098", "name": "Marquinhos", "position": "CB", "overall": 88, "pace": 82, "shooting": 88, "passing": 86, "dribbling": 87, "defending": 72, "physical": 74, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_099", "name": "Rúben Dias", "position": "CB", "overall": 83, "pace": 74, "shooting": 78, "passing": 74, "dribbling": 80, "defending": 74, "physical": 71, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_100", "name": "John Stones", "position": "CB", "overall": 78, "pace": 78, "shooting": 68, "passing": 74, "dribbling": 73, "defending": 76, "physical": 68, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_101", "name": "Éder Militão", "position": "CB", "overall": 73, "pace": 70, "shooting": 72, "passing": 62, "dribbling": 66, "defending": 60, "physical": 65, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_102", "name": "William Pacho", "position": "CB", "overall": 90, "pace": 84, "shooting": 84, "passing": 84, "dribbling": 81, "defending": 84, "physical": 84, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_103", "name": "Kim Min-jae", "position": "CB", "overall": 85, "pace": 76, "shooting": 74, "passing": 84, "dribbling": 74, "defending": 68, "physical": 81, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_104", "name": "Matthijs de Ligt", "position": "CB", "overall": 80, "pace": 80, "shooting": 78, "passing": 72, "dribbling": 80, "defending": 70, "physical": 78, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_105", "name": "David Alaba", "position": "CB", "overall": 75, "pace": 72, "shooting": 68, "passing": 72, "dribbling": 73, "defending": 72, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_106", "name": "Dayot Upamecano", "position": "CB", "overall": 92, "pace": 86, "shooting": 80, "passing": 82, "dribbling": 88, "defending": 78, "physical": 79, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_107", "name": "Jonathan Tah", "position": "CB", "overall": 87, "pace": 78, "shooting": 84, "passing": 82, "dribbling": 81, "defending": 80, "physical": 76, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_108", "name": "Antonio Silva", "position": "CB", "overall": 82, "pace": 82, "shooting": 74, "passing": 82, "dribbling": 74, "defending": 82, "physical": 73, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_109", "name": "Pau Torres", "position": "CB", "overall": 77, "pace": 74, "shooting": 64, "passing": 70, "dribbling": 67, "defending": 66, "physical": 70, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_110", "name": "Aymeric Laporte", "position": "CB", "overall": 72, "pace": 66, "shooting": 68, "passing": 70, "dribbling": 60, "defending": 68, "physical": 67, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_111", "name": "Robin Le Normand", "position": "CB", "overall": 89, "pace": 80, "shooting": 80, "passing": 80, "dribbling": 88, "defending": 74, "physical": 86, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_112", "name": "Iñigo Martínez", "position": "CB", "overall": 84, "pace": 84, "shooting": 84, "passing": 80, "dribbling": 81, "defending": 76, "physical": 83, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_113", "name": "Christensen", "position": "CB", "overall": 79, "pace": 76, "shooting": 74, "passing": 68, "dribbling": 74, "defending": 78, "physical": 65, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Standard"},
  {"id": "real_114", "name": "Kalidou Koulibaly", "position": "CB", "overall": 74, "pace": 68, "shooting": 64, "passing": 68, "dribbling": 67, "defending": 62, "physical": 62, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_115", "name": "Achraf Hakimi", "position": "CB", "overall": 91, "pace": 82, "shooting": 90, "passing": 90, "dribbling": 82, "defending": 86, "physical": 81, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_116", "name": "Trent Alexander-Arnold", "position": "CB", "overall": 86, "pace": 86, "shooting": 80, "passing": 78, "dribbling": 75, "defending": 70, "physical": 78, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_117", "name": "Reece James", "position": "CB", "overall": 81, "pace": 78, "shooting": 70, "passing": 78, "dribbling": 81, "defending": 72, "physical": 75, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_118", "name": "Kyle Walker", "position": "CB", "overall": 76, "pace": 70, "shooting": 74, "passing": 66, "dribbling": 74, "defending": 74, "physical": 72, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_119", "name": "Ben White", "position": "CB", "overall": 93, "pace": 84, "shooting": 86, "passing": 88, "dribbling": 89, "defending": 80, "physical": 91, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_120", "name": "Luke Shaw", "position": "CB", "overall": 88, "pace": 88, "shooting": 76, "passing": 88, "dribbling": 82, "defending": 82, "physical": 88, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_121", "name": "Andy Robertson", "position": "CB", "overall": 83, "pace": 80, "shooting": 80, "passing": 76, "dribbling": 75, "defending": 66, "physical": 70, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_122", "name": "Kieran Trippier", "position": "CB", "overall": 78, "pace": 72, "shooting": 70, "passing": 76, "dribbling": 68, "defending": 68, "physical": 67, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_123", "name": "Diogo Dalot", "position": "CB", "overall": 73, "pace": 64, "shooting": 60, "passing": 64, "dribbling": 61, "defending": 70, "physical": 64, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_124", "name": "Nuno Mendes", "position": "CB", "overall": 90, "pace": 90, "shooting": 86, "passing": 86, "dribbling": 89, "defending": 76, "physical": 83, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_125", "name": "Theo Hernández", "position": "CB", "overall": 85, "pace": 82, "shooting": 76, "passing": 74, "dribbling": 82, "defending": 78, "physical": 80, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_126", "name": "Lucas Hernández", "position": "CB", "overall": 80, "pace": 74, "shooting": 80, "passing": 74, "dribbling": 75, "defending": 80, "physical": 77, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_127", "name": "Ferland Mendy", "position": "CB", "overall": 75, "pace": 66, "shooting": 70, "passing": 74, "dribbling": 68, "defending": 64, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_128", "name": "Davies Alphonso", "position": "CB", "overall": 92, "pace": 92, "shooting": 82, "passing": 84, "dribbling": 83, "defending": 88, "physical": 78, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_129", "name": "João Cancelo", "position": "CB", "overall": 87, "pace": 84, "shooting": 86, "passing": 84, "dribbling": 76, "defending": 72, "physical": 75, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_130", "name": "Dani Carvajal", "position": "CB", "overall": 82, "pace": 76, "shooting": 76, "passing": 72, "dribbling": 82, "defending": 74, "physical": 72, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_131", "name": "Jeremie Frimpong", "position": "CB", "overall": 77, "pace": 68, "shooting": 66, "passing": 72, "dribbling": 75, "defending": 76, "physical": 69, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_132", "name": "Denzel Dumfries", "position": "CB", "overall": 72, "pace": 72, "shooting": 70, "passing": 72, "dribbling": 68, "defending": 60, "physical": 66, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_133", "name": "Noussair Mazraoui", "position": "CB", "overall": 89, "pace": 86, "shooting": 82, "passing": 82, "dribbling": 83, "defending": 84, "physical": 85, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_134", "name": "Raphael Guerreiro", "position": "CB", "overall": 84, "pace": 78, "shooting": 72, "passing": 82, "dribbling": 76, "defending": 68, "physical": 82, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_135", "name": "Oleksandr Zinchenko", "position": "CB", "overall": 79, "pace": 70, "shooting": 76, "passing": 70, "dribbling": 69, "defending": 70, "physical": 79, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_136", "name": "Ben Chilwell", "position": "CB", "overall": 74, "pace": 74, "shooting": 66, "passing": 70, "dribbling": 62, "defending": 72, "physical": 61, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_137", "name": "Marc Cucurella", "position": "CB", "overall": 91, "pace": 88, "shooting": 78, "passing": 80, "dribbling": 90, "defending": 78, "physical": 80, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_138", "name": "Pervis Estupiñán", "position": "CB", "overall": 86, "pace": 80, "shooting": 82, "passing": 80, "dribbling": 83, "defending": 80, "physical": 77, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_139", "name": "Nicolás Tagliafico", "position": "CB", "overall": 81, "pace": 72, "shooting": 72, "passing": 80, "dribbling": 76, "defending": 64, "physical": 74, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_140", "name": "Marcos Acuña", "position": "CB", "overall": 76, "pace": 76, "shooting": 76, "passing": 68, "dribbling": 69, "defending": 66, "physical": 71, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_141", "name": "Cristian Romero", "position": "CB", "overall": 93, "pace": 90, "shooting": 88, "passing": 90, "dribbling": 84, "defending": 90, "physical": 90, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_142", "name": "Nicolás Otamendi", "position": "CB", "overall": 88, "pace": 82, "shooting": 78, "passing": 78, "dribbling": 77, "defending": 74, "physical": 87, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_143", "name": "Gabriel Magalhães", "position": "CB", "overall": 83, "pace": 74, "shooting": 82, "passing": 78, "dribbling": 83, "defending": 76, "physical": 69, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_144", "name": "Thiago Silva", "position": "CB", "overall": 78, "pace": 78, "shooting": 72, "passing": 78, "dribbling": 76, "defending": 78, "physical": 66, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_145", "name": "Danilo", "position": "CB", "overall": 73, "pace": 70, "shooting": 62, "passing": 66, "dribbling": 69, "defending": 62, "physical": 63, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_146", "name": "Alex Sandro", "position": "CB", "overall": 85, "pace": 76, "shooting": 78, "passing": 76, "dribbling": 77, "defending": 70, "physical": 79, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_147", "name": "Émerson Royal", "position": "CB", "overall": 80, "pace": 80, "shooting": 68, "passing": 76, "dribbling": 70, "defending": 72, "physical": 76, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_148", "name": "Wendell", "position": "CB", "overall": 75, "pace": 72, "shooting": 72, "passing": 64, "dribbling": 63, "defending": 74, "physical": 73, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_149", "name": "Lucas Beraldo", "position": "CB", "overall": 92, "pace": 86, "shooting": 84, "passing": 86, "dribbling": 91, "defending": 80, "physical": 92, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_150", "name": "Bremer", "position": "CB", "overall": 87, "pace": 78, "shooting": 74, "passing": 86, "dribbling": 84, "defending": 82, "physical": 74, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_151", "name": "Igor Julio", "position": "CB", "overall": 82, "pace": 82, "shooting": 78, "passing": 74, "dribbling": 77, "defending": 66, "physical": 71, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_152", "name": "Renan Lodi", "position": "CB", "overall": 77, "pace": 74, "shooting": 68, "passing": 74, "dribbling": 70, "defending": 68, "physical": 68, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_153", "name": "Gabriel Paulista", "position": "CB", "overall": 72, "pace": 66, "shooting": 72, "passing": 62, "dribbling": 63, "defending": 70, "physical": 65, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_154", "name": "Pepe", "position": "CB", "overall": 89, "pace": 80, "shooting": 84, "passing": 84, "dribbling": 78, "defending": 76, "physical": 84, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_155", "name": "José María Giménez", "position": "CB", "overall": 84, "pace": 84, "shooting": 74, "passing": 84, "dribbling": 84, "defending": 78, "physical": 81, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_156", "name": "Ronald Araújo", "position": "CB", "overall": 79, "pace": 76, "shooting": 78, "passing": 72, "dribbling": 77, "defending": 62, "physical": 78, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_157", "name": "Diego Godín", "position": "CB", "overall": 74, "pace": 68, "shooting": 68, "passing": 72, "dribbling": 70, "defending": 64, "physical": 60, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_158", "name": "Diego Lugano", "position": "CB", "overall": 91, "pace": 82, "shooting": 80, "passing": 82, "dribbling": 85, "defending": 88, "physical": 79, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_159", "name": "Martín Cáceres", "position": "CB", "overall": 86, "pace": 86, "shooting": 84, "passing": 82, "dribbling": 78, "defending": 72, "physical": 76, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_160", "name": "Stefan de Vrij", "position": "CB", "overall": 81, "pace": 78, "shooting": 74, "passing": 70, "dribbling": 71, "defending": 74, "physical": 73, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_161", "name": "Raphaël Varane", "position": "CB", "overall": 76, "pace": 70, "shooting": 64, "passing": 70, "dribbling": 64, "defending": 76, "physical": 70, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_162", "name": "Samuel Umtiti", "position": "CB", "overall": 93, "pace": 84, "shooting": 90, "passing": 92, "dribbling": 92, "defending": 82, "physical": 89, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_163", "name": "Presnel Kimpembe", "position": "CB", "overall": 88, "pace": 88, "shooting": 80, "passing": 80, "dribbling": 85, "defending": 84, "physical": 86, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_164", "name": "Jules Koundé", "position": "CB", "overall": 83, "pace": 80, "shooting": 70, "passing": 80, "dribbling": 78, "defending": 68, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_165", "name": "Ibrahima Konaté", "position": "CB", "overall": 78, "pace": 72, "shooting": 74, "passing": 68, "dribbling": 71, "defending": 70, "physical": 65, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_166", "name": "Fikayo Tomori", "position": "CB", "overall": 73, "pace": 64, "shooting": 64, "passing": 68, "dribbling": 64, "defending": 72, "physical": 62, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_167", "name": "Marc Guéhi", "position": "CB", "overall": 90, "pace": 90, "shooting": 90, "passing": 90, "dribbling": 79, "defending": 78, "physical": 81, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_168", "name": "Chris Smalling", "position": "CB", "overall": 85, "pace": 82, "shooting": 80, "passing": 78, "dribbling": 85, "defending": 80, "physical": 78, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_169", "name": "Harry Maguire", "position": "CB", "overall": 80, "pace": 74, "shooting": 70, "passing": 78, "dribbling": 78, "defending": 64, "physical": 75, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_170", "name": "Eric Dier", "position": "CB", "overall": 75, "pace": 66, "shooting": 74, "passing": 66, "dribbling": 71, "defending": 66, "physical": 72, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_171", "name": "Joe Gomez", "position": "CB", "overall": 92, "pace": 92, "shooting": 86, "passing": 88, "dribbling": 86, "defending": 90, "physical": 91, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_172", "name": "Conor Coady", "position": "CB", "overall": 87, "pace": 84, "shooting": 76, "passing": 76, "dribbling": 79, "defending": 74, "physical": 73, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_173", "name": "Levi Colwill", "position": "CB", "overall": 82, "pace": 76, "shooting": 80, "passing": 76, "dribbling": 72, "defending": 76, "physical": 70, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_174", "name": "Ezri Konsa", "position": "CB", "overall": 77, "pace": 68, "shooting": 70, "passing": 76, "dribbling": 65, "defending": 60, "physical": 67, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_175", "name": "David Luiz", "position": "CB", "overall": 72, "pace": 72, "shooting": 60, "passing": 64, "dribbling": 71, "defending": 62, "physical": 64, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_176", "name": "Thiago Djalo", "position": "CB", "overall": 89, "pace": 86, "shooting": 86, "passing": 86, "dribbling": 86, "defending": 86, "physical": 83, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_177", "name": "Dan-Axel Zagadou", "position": "CB", "overall": 84, "pace": 78, "shooting": 76, "passing": 74, "dribbling": 79, "defending": 70, "physical": 80, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_178", "name": "Jean-Clair Todibo", "position": "CB", "overall": 79, "pace": 70, "shooting": 66, "passing": 74, "dribbling": 72, "defending": 72, "physical": 77, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Standard"},
  {"id": "real_179", "name": "Milan Škriniar", "position": "CB", "overall": 74, "pace": 74, "shooting": 70, "passing": 74, "dribbling": 65, "defending": 74, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_180", "name": "Štefan Bajčetić", "position": "CB", "overall": 91, "pace": 88, "shooting": 82, "passing": 84, "dribbling": 80, "defending": 80, "physical": 78, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_181", "name": "Dejan Lovren", "position": "CB", "overall": 86, "pace": 80, "shooting": 86, "passing": 84, "dribbling": 86, "defending": 82, "physical": 75, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_182", "name": "Joško Gvardiol", "position": "CB", "overall": 81, "pace": 72, "shooting": 76, "passing": 72, "dribbling": 79, "defending": 66, "physical": 72, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_183", "name": "Dušan Vlahović", "position": "CB", "overall": 76, "pace": 76, "shooting": 66, "passing": 72, "dribbling": 72, "defending": 68, "physical": 69, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_184", "name": "Emre Can", "position": "CB", "overall": 93, "pace": 90, "shooting": 92, "passing": 82, "dribbling": 87, "defending": 92, "physical": 88, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_185", "name": "Jerome Boateng", "position": "CB", "overall": 88, "pace": 82, "shooting": 82, "passing": 82, "dribbling": 80, "defending": 76, "physical": 85, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_186", "name": "Mats Hummels", "position": "CB", "overall": 83, "pace": 74, "shooting": 72, "passing": 82, "dribbling": 73, "defending": 78, "physical": 82, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_187", "name": "Per Mertesacker", "position": "CB", "overall": 78, "pace": 78, "shooting": 76, "passing": 70, "dribbling": 66, "defending": 62, "physical": 64, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_188", "name": "Philipp Lahm", "position": "CB", "overall": 73, "pace": 70, "shooting": 66, "passing": 70, "dribbling": 72, "defending": 64, "physical": 61, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_189", "name": "Bastian Schweinsteiger", "position": "CB", "overall": 90, "pace": 84, "shooting": 78, "passing": 80, "dribbling": 87, "defending": 88, "physical": 80, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_190", "name": "Gerard Piqué", "position": "CB", "overall": 85, "pace": 76, "shooting": 82, "passing": 80, "dribbling": 80, "defending": 72, "physical": 77, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_191", "name": "Sergio Ramos", "position": "CB", "overall": 80, "pace": 77, "shooting": 72, "passing": 80, "dribbling": 73, "defending": 79, "physical": 74, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare","photo": "/players/ramos.png"},
  {"id": "real_192", "name": "Carles Puyol", "position": "CB", "overall": 95, "pace": 84, "shooting": 62, "passing": 72, "dribbling": 66, "defending": 91, "physical": 88, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 85, "rarity": "Legendary", "photo": "/players/puyol.png"},
  {"id": "real_193", "name": "Javier Mascherano", "position": "CB", "overall": 92, "pace": 86, "shooting": 88, "passing": 90, "dribbling": 81, "defending": 82, "physical": 90, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_194", "name": "Marcelo", "position": "CB", "overall": 87, "pace": 78, "shooting": 78, "passing": 78, "dribbling": 87, "defending": 84, "physical": 87, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_195", "name": "Roberto Carlos", "position": "LB", "overall": 96, "pace": 97, "shooting": 82, "passing": 81, "dribbling": 83, "defending": 79, "physical": 75, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 64, "rarity": "Legendary"},
  {"id": "real_196", "name": "Cafu", "position": "RB", "overall": 95, "pace": 94, "shooting": 72, "passing": 82, "dribbling": 85, "defending": 76, "physical": 76, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 68, "rarity": "Legendary"},
  {"id": "real_197", "name": "Lucio", "position": "CB", "overall": 72, "pace": 66, "shooting": 62, "passing": 66, "dribbling": 66, "defending": 72, "physical": 63, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_198", "name": "Dani Alves", "position": "CB", "overall": 89, "pace": 87, "shooting": 83, "passing": 88, "dribbling": 84, "defending": 78, "physical": 82, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic","photo": "/players/alves.png"},
  {"id": "real_199", "name": "Maicon", "position": "CB", "overall": 84, "pace": 84, "shooting": 78, "passing": 76, "dribbling": 74, "defending": 80, "physical": 79, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_200", "name": "Juan Pablo Sorín", "position": "CB", "overall": 79, "pace": 76, "shooting": 68, "passing": 76, "dribbling": 67, "defending": 64, "physical": 76, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_201", "name": "Fabio Cannavaro", "position": "CB", "overall": 95, "pace": 86, "shooting": 72, "passing": 80, "dribbling": 73, "defending": 96, "physical": 89, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 60, "rarity": "Legendary","photo": "/players/cannavaro.png"},
  {"id": "real_202", "name": "Giorgio Chiellini", "position": "CB", "overall": 91, "pace": 82, "shooting": 84, "passing": 86, "dribbling": 88, "defending": 90, "physical": 77, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_203", "name": "Leonardo Bonucci", "position": "CB", "overall": 86, "pace": 86, "shooting": 74, "passing": 86, "dribbling": 81, "defending": 74, "physical": 74, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_204", "name": "Paolo Maldini", "position": "CB", "overall": 98, "pace": 84, "shooting": 78, "passing": 78, "dribbling": 74, "defending": 90, "physical": 85, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 81, "rarity": "Legendary","photo": "/players/maldini.png"},
  {"id": "real_205", "name": "Alessandro Nesta", "position": "CB", "overall": 96, "pace": 83, "shooting": 68, "passing": 74, "dribbling": 67, "defending": 94, "physical": 86, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 83, "rarity": "Legendary","photo": "/players/nesta.png"},
  {"id": "real_206", "name": "Franco Baresi", "position": "CB", "overall": 96, "pace": 84, "shooting": 80, "passing": 84, "dribbling": 82, "defending": 92, "physical": 87, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 90, "rarity": "Legendary"},
  {"id": "real_207", "name": "Lilian Thuram", "position": "CB", "overall": 94, "pace": 94, "shooting": 81, "passing": 84, "dribbling": 80, "defending": 90, "physical": 88, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 88, "rarity": "Legendary"},
  {"id": "real_208", "name": "Marcel Desailly", "position": "CB", "overall": 95, "pace": 87, "shooting": 74, "passing": 72, "dribbling": 81, "defending": 89, "physical": 87, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 83, "rarity": "Legendary"},
  {"id": "real_209", "name": "Rio Ferdinand", "position": "CB", "overall": 94, "pace": 83, "shooting": 78, "passing": 72, "dribbling": 74, "defending": 86, "physical": 84, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 81, "rarity": "Legendary"},
  {"id": "real_210", "name": "John Terry", "position": "CB", "overall": 94, "pace": 80, "shooting": 68, "passing": 72, "dribbling": 67, "defending": 91, "physical": 91, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 84, "rarity": "Legendary"},
  {"id": "real_211", "name": "Ashley Cole", "position": "CB", "overall": 90, "pace": 90, "shooting": 80, "passing": 82, "dribbling": 82, "defending": 80, "physical": 79, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_212", "name": "Gary Neville", "position": "CB", "overall": 85, "pace": 82, "shooting": 84, "passing": 82, "dribbling": 75, "defending": 82, "physical": 76, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_213", "name": "Jaap Stam", "position": "CB", "overall": 80, "pace": 74, "shooting": 74, "passing": 70, "dribbling": 68, "defending": 66, "physical": 73, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_214", "name": "William Gallas", "position": "CB", "overall": 75, "pace": 66, "shooting": 64, "passing": 70, "dribbling": 74, "defending": 68, "physical": 70, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_215", "name": "Patrice Evra", "position": "CB", "overall": 92, "pace": 92, "shooting": 90, "passing": 92, "dribbling": 89, "defending": 92, "physical": 89, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_216", "name": "Rodri", "position": "CM", "overall": 87, "pace": 84, "shooting": 80, "passing": 80, "dribbling": 82, "defending": 76, "physical": 86, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_217", "name": "Declan Rice", "position": "CM", "overall": 82, "pace": 76, "shooting": 70, "passing": 80, "dribbling": 75, "defending": 78, "physical": 68, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_218", "name": "Martin Ødegaard", "position": "CM", "overall": 77, "pace": 68, "shooting": 74, "passing": 68, "dribbling": 68, "defending": 62, "physical": 65, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_219", "name": "Kevin De Bruyne", "position": "CM", "overall": 90, "pace": 90, "shooting": 82, "passing": 86, "dribbling": 79, "defending": 82, "physical": 80, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_220", "name": "Jude Bellingham", "position": "CM", "overall": 90, "pace": 87, "shooting": 77, "passing": 79, "dribbling": 90, "defending": 89, "physical": 82, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_221", "name": "Toni Kroos", "position": "CM", "overall": 84, "pace": 78, "shooting": 80, "passing": 78, "dribbling": 82, "defending": 72, "physical": 78, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_222", "name": "Luka Modrić", "position": "CM", "overall": 79, "pace": 70, "shooting": 70, "passing": 78, "dribbling": 75, "defending": 74, "physical": 75, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_223", "name": "Federico Valverde", "position": "CM", "overall": 74, "pace": 74, "shooting": 74, "passing": 66, "dribbling": 68, "defending": 58, "physical": 72, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_224", "name": "Eduardo Camavinga", "position": "CM", "overall": 91, "pace": 88, "shooting": 86, "passing": 88, "dribbling": 83, "defending": 82, "physical": 91, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_225", "name": "Enzo Fernández", "position": "CM", "overall": 86, "pace": 80, "shooting": 76, "passing": 76, "dribbling": 76, "defending": 84, "physical": 73, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_226", "name": "Alexis Mac Allister", "position": "CM", "overall": 81, "pace": 72, "shooting": 80, "passing": 76, "dribbling": 69, "defending": 68, "physical": 70, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_227", "name": "Bernardo Silva", "position": "CM", "overall": 76, "pace": 76, "shooting": 70, "passing": 76, "dribbling": 75, "defending": 70, "physical": 67, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_228", "name": "Bruno Fernandes", "position": "CM", "overall": 93, "pace": 90, "shooting": 82, "passing": 86, "dribbling": 90, "defending": 76, "physical": 86, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_229", "name": "Pedri", "position": "CM", "overall": 88, "pace": 82, "shooting": 86, "passing": 86, "dribbling": 83, "defending": 78, "physical": 83, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic","photo": "/players/pedri.png"},
  {"id": "real_230", "name": "Gavi", "position": "CM", "overall": 83, "pace": 74, "shooting": 76, "passing": 74, "dribbling": 76, "defending": 80, "physical": 80, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_231", "name": "Frenkie de Jong", "position": "CM", "overall": 78, "pace": 78, "shooting": 66, "passing": 74, "dribbling": 69, "defending": 64, "physical": 77, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_232", "name": "Joshua Kimmich", "position": "CM", "overall": 73, "pace": 70, "shooting": 70, "passing": 62, "dribbling": 62, "defending": 66, "physical": 59, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_233", "name": "Leon Goretzka", "position": "CM", "overall": 90, "pace": 84, "shooting": 82, "passing": 84, "dribbling": 90, "defending": 90, "physical": 78, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_234", "name": "Ilkay Gündogan", "position": "CM", "overall": 85, "pace": 76, "shooting": 72, "passing": 84, "dribbling": 83, "defending": 74, "physical": 75, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_235", "name": "Jamal Musiala", "position": "CM", "overall": 80, "pace": 80, "shooting": 76, "passing": 72, "dribbling": 76, "defending": 76, "physical": 72, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_236", "name": "Florian Wirtz", "position": "CM", "overall": 75, "pace": 72, "shooting": 66, "passing": 72, "dribbling": 69, "defending": 60, "physical": 69, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_237", "name": "Xavi Simons", "position": "CM", "overall": 92, "pace": 86, "shooting": 92, "passing": 82, "dribbling": 84, "defending": 84, "physical": 88, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_238", "name": "Vitinha", "position": "CM", "overall": 87, "pace": 78, "shooting": 82, "passing": 82, "dribbling": 77, "defending": 86, "physical": 85, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_239", "name": "Warren Zaïre-Emery", "position": "CM", "overall": 82, "pace": 82, "shooting": 72, "passing": 82, "dribbling": 70, "defending": 70, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_240", "name": "João Neves", "position": "CM", "overall": 77, "pace": 74, "shooting": 76, "passing": 70, "dribbling": 76, "defending": 72, "physical": 64, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_241", "name": "Bruno Guimarães", "position": "CM", "overall": 72, "pace": 66, "shooting": 66, "passing": 70, "dribbling": 69, "defending": 56, "physical": 61, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_242", "name": "Lucas Paquetá", "position": "CM", "overall": 89, "pace": 80, "shooting": 78, "passing": 80, "dribbling": 84, "defending": 80, "physical": 80, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_243", "name": "James Maddison", "position": "CM", "overall": 84, "pace": 84, "shooting": 82, "passing": 80, "dribbling": 77, "defending": 82, "physical": 77, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_244", "name": "Cole Palmer", "position": "CM", "overall": 79, "pace": 76, "shooting": 72, "passing": 68, "dribbling": 70, "defending": 66, "physical": 74, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Standard"},
  {"id": "real_245", "name": "Phil Foden", "position": "CM", "overall": 74, "pace": 68, "shooting": 62, "passing": 68, "dribbling": 63, "defending": 68, "physical": 71, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_246", "name": "Mason Mount", "position": "CM", "overall": 91, "pace": 82, "shooting": 88, "passing": 90, "dribbling": 91, "defending": 74, "physical": 90, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_247", "name": "Conor Gallagher", "position": "CM", "overall": 86, "pace": 86, "shooting": 78, "passing": 78, "dribbling": 84, "defending": 76, "physical": 72, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_248", "name": "Kobbie Mainoo", "position": "CM", "overall": 81, "pace": 78, "shooting": 68, "passing": 78, "dribbling": 77, "defending": 78, "physical": 69, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_249", "name": "James Ward-Prowse", "position": "CM", "overall": 76, "pace": 70, "shooting": 72, "passing": 66, "dribbling": 70, "defending": 62, "physical": 66, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_250", "name": "Kalvin Phillips", "position": "CM", "overall": 93, "pace": 84, "shooting": 84, "passing": 88, "dribbling": 85, "defending": 86, "physical": 85, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_251", "name": "Jordan Henderson", "position": "CM", "overall": 88, "pace": 88, "shooting": 88, "passing": 88, "dribbling": 78, "defending": 88, "physical": 82, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_252", "name": "Christian Eriksen", "position": "CM", "overall": 83, "pace": 80, "shooting": 78, "passing": 76, "dribbling": 71, "defending": 72, "physical": 79, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_253", "name": "Thomas Partey", "position": "CM", "overall": 78, "pace": 72, "shooting": 68, "passing": 76, "dribbling": 77, "defending": 74, "physical": 76, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_254", "name": "Amadou Onana", "position": "CM", "overall": 73, "pace": 64, "shooting": 72, "passing": 64, "dribbling": 70, "defending": 58, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_255", "name": "Youssouf Fofana", "position": "CM", "overall": 90, "pace": 90, "shooting": 84, "passing": 86, "dribbling": 85, "defending": 82, "physical": 77, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_256", "name": "Adrien Rabiot", "position": "CM", "overall": 85, "pace": 82, "shooting": 74, "passing": 74, "dribbling": 78, "defending": 84, "physical": 74, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_257", "name": "Manuel Locatelli", "position": "CM", "overall": 80, "pace": 74, "shooting": 78, "passing": 74, "dribbling": 71, "defending": 68, "physical": 71, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_258", "name": "Nicolò Barella", "position": "CM", "overall": 75, "pace": 66, "shooting": 68, "passing": 74, "dribbling": 64, "defending": 70, "physical": 68, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_259", "name": "Davide Frattesi", "position": "CM", "overall": 92, "pace": 92, "shooting": 80, "passing": 84, "dribbling": 92, "defending": 76, "physical": 87, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_260", "name": "Jorginho", "position": "CM", "overall": 87, "pace": 84, "shooting": 84, "passing": 84, "dribbling": 85, "defending": 78, "physical": 84, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_261", "name": "Marco Verratti", "position": "CM", "overall": 82, "pace": 76, "shooting": 74, "passing": 72, "dribbling": 78, "defending": 80, "physical": 81, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_262", "name": "Andrea Pirlo", "position": "CM", "overall": 96, "pace": 68, "shooting": 79, "passing": 94, "dribbling": 85, "defending": 86, "physical": 63, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 64, "rarity": "Legendary"},
  {"id": "real_263", "name": "Gennaro Gattuso", "position": "CM", "overall": 72, "pace": 72, "shooting": 68, "passing": 72, "dribbling": 64, "defending": 66, "physical": 60, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_264", "name": "Daniele De Rossi", "position": "CM", "overall": 89, "pace": 86, "shooting": 80, "passing": 82, "dribbling": 79, "defending": 72, "physical": 79, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_265", "name": "Francesco Totti", "position": "CM", "overall": 84, "pace": 78, "shooting": 84, "passing": 82, "dribbling": 72, "defending": 74, "physical": 76, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_266", "name": "Clarence Seedorf", "position": "CM", "overall": 94, "pace": 90, "shooting": 78, "passing": 88, "dribbling": 81, "defending": 87, "physical": 91, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 79, "rarity": "Legendary","photo": "/players/seedorf.png"},
  {"id": "real_267", "name": "Andrea Iniesta", "position": "CM", "overall": 74, "pace": 74, "shooting": 64, "passing": 70, "dribbling": 71, "defending": 60, "physical": 70, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_268", "name": "Xavi Hernández", "position": "CM", "overall": 97, "pace": 85, "shooting": 84, "passing": 91, "dribbling": 86, "defending": 83, "physical": 78, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Legendary","photo": "/players/xavi.png"},
  {"id": "real_269", "name": "Sergio Busquets", "position": "CM", "overall": 86, "pace": 80, "shooting": 80, "passing": 80, "dribbling": 79, "defending": 86, "physical": 86, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_270", "name": "Cesc Fàbregas", "position": "CM", "overall": 81, "pace": 72, "shooting": 70, "passing": 80, "dribbling": 72, "defending": 70, "physical": 68, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_271", "name": "David Silva", "position": "CM", "overall": 76, "pace": 76, "shooting": 74, "passing": 68, "dribbling": 65, "defending": 72, "physical": 65, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_272", "name": "Thiago Alcântara", "position": "CM", "overall": 93, "pace": 90, "shooting": 86, "passing": 90, "dribbling": 93, "defending": 78, "physical": 84, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_273", "name": "Juan Mata", "position": "CM", "overall": 88, "pace": 82, "shooting": 76, "passing": 78, "dribbling": 86, "defending": 80, "physical": 81, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_274", "name": "Santi Cazorla", "position": "CM", "overall": 83, "pace": 74, "shooting": 80, "passing": 78, "dribbling": 79, "defending": 82, "physical": 78, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_275", "name": "Isco", "position": "CM", "overall": 78, "pace": 78, "shooting": 70, "passing": 78, "dribbling": 72, "defending": 66, "physical": 75, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_276", "name": "Mesut Özil", "position": "CM", "overall": 73, "pace": 70, "shooting": 60, "passing": 66, "dribbling": 65, "defending": 68, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_277", "name": "Michael Ballack", "position": "CM", "overall": 90, "pace": 84, "shooting": 86, "passing": 88, "dribbling": 80, "defending": 74, "physical": 76, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_278", "name": "Xabi Alonso", "position": "CM", "overall": 85, "pace": 76, "shooting": 76, "passing": 76, "dribbling": 73, "defending": 76, "physical": 73, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_279", "name": "Steven Gerrard", "position": "CM", "overall": 94, "pace": 80, "shooting": 82, "passing": 88, "dribbling": 84, "defending": 78, "physical": 70, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 80, "rarity": "Legendary"},
  {"id": "real_280", "name": "Frank Lampard", "position": "CM", "overall": 94, "pace": 77, "shooting": 79, "passing": 90, "dribbling": 84, "defending": 79, "physical": 74, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 75, "rarity": "Legendary"},
  {"id": "real_281", "name": "Paul Scholes", "position": "CM", "overall": 95, "pace": 86, "shooting": 82, "passing": 86, "dribbling": 87, "defending": 80, "physical": 77, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 80, "rarity": "Legendary","photo": "/players/scholes.png"},
  {"id": "real_282", "name": "David Beckham", "position": "CM", "overall": 94, "pace": 82, "shooting": 86, "passing": 97, "dribbling": 84, "defending": 70, "physical": 80, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Legendary","photo": "/players/beckham.png"},
  {"id": "real_283", "name": "Patrick Vieira", "position": "CM", "overall": 96, "pace": 87, "shooting": 81, "passing": 89, "dribbling": 82, "defending": 87, "physical": 85, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 82, "rarity": "Legendary","photo": "/players/vieria.png"},
  {"id": "real_284", "name": "Claude Makélélé", "position": "CM", "overall": 77, "pace": 74, "shooting": 66, "passing": 74, "dribbling": 66, "defending": 74, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_285", "name": "N'Golo Kanté", "position": "CM", "overall": 72, "pace": 66, "shooting": 70, "passing": 62, "dribbling": 72, "defending": 58, "physical": 59, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_286", "name": "Paul Pogba", "position": "CM", "overall": 89, "pace": 80, "shooting": 82, "passing": 84, "dribbling": 87, "defending": 82, "physical": 78, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_287", "name": "Yaya Touré", "position": "CM", "overall": 84, "pace": 84, "shooting": 72, "passing": 84, "dribbling": 80, "defending": 84, "physical": 75, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_288", "name": "Michael Essien", "position": "CM", "overall": 79, "pace": 76, "shooting": 76, "passing": 72, "dribbling": 73, "defending": 68, "physical": 72, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_289", "name": "Jay-Jay Okocha", "position": "CM", "overall": 74, "pace": 68, "shooting": 66, "passing": 72, "dribbling": 66, "defending": 70, "physical": 69, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_290", "name": "Riyad Mahrez", "position": "CM", "overall": 91, "pace": 82, "shooting": 78, "passing": 82, "dribbling": 81, "defending": 76, "physical": 88, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_291", "name": "Angel Di María", "position": "CM", "overall": 86, "pace": 86, "shooting": 82, "passing": 82, "dribbling": 74, "defending": 78, "physical": 85, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_292", "name": "Ángel Correa", "position": "CM", "overall": 81, "pace": 78, "shooting": 72, "passing": 70, "dribbling": 80, "defending": 80, "physical": 67, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_293", "name": "Paulo Dybala", "position": "CM", "overall": 76, "pace": 70, "shooting": 76, "passing": 70, "dribbling": 73, "defending": 64, "physical": 64, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_294", "name": "James Rodríguez", "position": "CM", "overall": 93, "pace": 84, "shooting": 88, "passing": 92, "dribbling": 88, "defending": 88, "physical": 83, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_295", "name": "Juan Román Riquelme", "position": "CM", "overall": 94, "pace": 88, "shooting": 78, "passing": 80, "dribbling": 81, "defending": 72, "physical": 80, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Legendary"},
  {"id": "real_296", "name": "Kaká", "position": "CM", "overall": 95, "pace": 85, "shooting": 84, "passing": 84, "dribbling": 89, "defending": 69, "physical": 77, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 65, "rarity": "Legendary"},
  {"id": "real_297", "name": "Ronaldinho", "position": "CAM", "overall": 97, "pace": 85, "shooting": 87, "passing": 85, "dribbling": 94, "defending": 60, "physical": 79, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 78, "rarity": "Legendary","photo": "/players/ronaldinho.png"},
  {"id": "real_298", "name": "Zinedine Zidane", "position": "CM", "overall": 98, "pace": 86, "shooting": 85, "passing": 85, "dribbling": 88, "defending": 60, "physical": 77, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 60, "rarity": "Legendary","photo": "/players/zidane.png"},
  {"id": "real_299", "name": "Michel Platini", "position": "CM", "overall": 97, "pace": 90, "shooting": 88, "passing": 90, "dribbling": 88, "defending": 71, "physical": 80, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 60, "rarity": "Legendary"},
  {"id": "real_300", "name": "Diego Maradona", "position": "CM", "overall": 99, "pace": 84, "shooting": 89, "passing": 82, "dribbling": 96, "defending": 65, "physical": 72, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 81, "rarity": "Legendary"},
  {"id": "real_301", "name": "Diego Simeone", "position": "CM", "overall": 80, "pace": 74, "shooting": 68, "passing": 78, "dribbling": 74, "defending": 70, "physical": 69, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_302", "name": "Enzo Scifo", "position": "CM", "overall": 75, "pace": 66, "shooting": 72, "passing": 66, "dribbling": 67, "defending": 72, "physical": 66, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_303", "name": "Dries Mertens", "position": "CM", "overall": 92, "pace": 92, "shooting": 84, "passing": 88, "dribbling": 82, "defending": 78, "physical": 85, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_304", "name": "Hakan Çalhanoğlu", "position": "CM", "overall": 87, "pace": 84, "shooting": 74, "passing": 76, "dribbling": 75, "defending": 80, "physical": 82, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_305", "name": "Piotr Zieliński", "position": "CM", "overall": 82, "pace": 76, "shooting": 78, "passing": 76, "dribbling": 81, "defending": 82, "physical": 79, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_306", "name": "Christian Pulisic", "position": "CM", "overall": 77, "pace": 68, "shooting": 68, "passing": 76, "dribbling": 74, "defending": 66, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_307", "name": "Weston McKennie", "position": "CM", "overall": 72, "pace": 72, "shooting": 72, "passing": 64, "dribbling": 67, "defending": 68, "physical": 58, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_308", "name": "Tyler Adams", "position": "CM", "overall": 89, "pace": 86, "shooting": 84, "passing": 86, "dribbling": 82, "defending": 74, "physical": 77, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_309", "name": "Giovanni Reyna", "position": "CM", "overall": 84, "pace": 78, "shooting": 74, "passing": 74, "dribbling": 75, "defending": 76, "physical": 74, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_310", "name": "Yunus Musah", "position": "CM", "overall": 79, "pace": 70, "shooting": 78, "passing": 74, "dribbling": 68, "defending": 78, "physical": 71, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_311", "name": "Ismaël Bennacer", "position": "CM", "overall": 74, "pace": 74, "shooting": 68, "passing": 74, "dribbling": 74, "defending": 62, "physical": 68, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_312", "name": "Sofyan Amrabat", "position": "CM", "overall": 91, "pace": 88, "shooting": 80, "passing": 84, "dribbling": 89, "defending": 86, "physical": 87, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_313", "name": "Amine Harit", "position": "CM", "overall": 86, "pace": 80, "shooting": 84, "passing": 84, "dribbling": 82, "defending": 70, "physical": 84, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_314", "name": "Houssem Aouar", "position": "CM", "overall": 81, "pace": 72, "shooting": 74, "passing": 72, "dribbling": 75, "defending": 72, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_315", "name": "Mohamed Elneny", "position": "CM", "overall": 76, "pace": 76, "shooting": 64, "passing": 72, "dribbling": 68, "defending": 74, "physical": 63, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_316", "name": "Wilfred Ndidi", "position": "CM", "overall": 93, "pace": 90, "shooting": 90, "passing": 82, "dribbling": 83, "defending": 80, "physical": 82, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_317", "name": "Alex Iwobi", "position": "CM", "overall": 88, "pace": 82, "shooting": 80, "passing": 82, "dribbling": 76, "defending": 82, "physical": 79, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_318", "name": "John Obi Mikel", "position": "CM", "overall": 83, "pace": 74, "shooting": 70, "passing": 82, "dribbling": 82, "defending": 66, "physical": 76, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_319", "name": "Michael Olise", "position": "CM", "overall": 78, "pace": 78, "shooting": 74, "passing": 70, "dribbling": 75, "defending": 68, "physical": 73, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_320", "name": "Khvicha Kvaratskhelia", "position": "CM", "overall": 73, "pace": 70, "shooting": 64, "passing": 70, "dribbling": 68, "defending": 70, "physical": 70, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_321", "name": "Georginio Wijnaldum", "position": "CM", "overall": 90, "pace": 84, "shooting": 90, "passing": 80, "dribbling": 83, "defending": 76, "physical": 89, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_322", "name": "Memphis Depay", "position": "CM", "overall": 85, "pace": 76, "shooting": 80, "passing": 80, "dribbling": 76, "defending": 78, "physical": 71, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_323", "name": "Steven Berghuis", "position": "CM", "overall": 80, "pace": 80, "shooting": 70, "passing": 80, "dribbling": 69, "defending": 80, "physical": 68, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_324", "name": "Donny van de Beek", "position": "CM", "overall": 75, "pace": 72, "shooting": 74, "passing": 68, "dribbling": 75, "defending": 64, "physical": 65, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_325", "name": "Davy Klaassen", "position": "CM", "overall": 92, "pace": 86, "shooting": 86, "passing": 90, "dribbling": 90, "defending": 88, "physical": 84, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_326", "name": "Teun Koopmeiners", "position": "CM", "overall": 87, "pace": 78, "shooting": 76, "passing": 78, "dribbling": 83, "defending": 72, "physical": 81, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_327", "name": "Jeremie Boga", "position": "CM", "overall": 82, "pace": 82, "shooting": 80, "passing": 78, "dribbling": 76, "defending": 74, "physical": 78, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_328", "name": "Franck Kessié", "position": "CM", "overall": 77, "pace": 74, "shooting": 70, "passing": 66, "dribbling": 69, "defending": 76, "physical": 75, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_329", "name": "Fabian Ruiz", "position": "CM", "overall": 72, "pace": 66, "shooting": 60, "passing": 66, "dribbling": 62, "defending": 60, "physical": 72, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_330", "name": "Mikel Merino", "position": "CM", "overall": 89, "pace": 80, "shooting": 86, "passing": 88, "dribbling": 77, "defending": 84, "physical": 76, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_331", "name": "Dani Olmo", "position": "CM", "overall": 84, "pace": 84, "shooting": 76, "passing": 76, "dribbling": 83, "defending": 68, "physical": 73, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_332", "name": "Mikel Oyarzabal", "position": "CM", "overall": 79, "pace": 76, "shooting": 66, "passing": 76, "dribbling": 76, "defending": 70, "physical": 70, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_333", "name": "David Batty", "position": "CM", "overall": 74, "pace": 68, "shooting": 70, "passing": 64, "dribbling": 69, "defending": 72, "physical": 67, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_334", "name": "Paul Gascoigne", "position": "CM", "overall": 91, "pace": 82, "shooting": 82, "passing": 86, "dribbling": 84, "defending": 78, "physical": 86, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_335", "name": "Roberto Baggio", "position": "CM", "overall": 86, "pace": 86, "shooting": 86, "passing": 86, "dribbling": 77, "defending": 80, "physical": 83, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_336", "name": "Juan Sebastián Verón", "position": "CM", "overall": 81, "pace": 78, "shooting": 76, "passing": 74, "dribbling": 70, "defending": 64, "physical": 80, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_337", "name": "Lionel Messi", "position": "ST", "overall": 99, "pace": 85, "shooting": 99, "passing": 89, "dribbling": 99, "defending": 54, "physical": 68, "awareness": 54, "catching": 54, "reflexes": 54, "diving": 54, "jumping": 70, "rarity": "Legendary", "photo": "/players/messi.png"},
  {"id": "real_338", "name": "Kylian Mbappé", "position": "ST", "overall": 90, "pace": 97, "shooting": 91, "passing": 67, "dribbling": 88, "defending": 59, "physical": 78, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 70, "rarity": "Epic"},
  {"id": "real_339", "name": "Erling Haaland", "position": "ST", "overall": 90, "pace": 90, "shooting": 92, "passing": 64, "dribbling": 80, "defending": 60, "physical": 90, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 60, "rarity": "Epic","photo": "/players/haaland.png"},
  {"id": "real_340", "name": "Vinícius Júnior", "position": "ST", "overall": 83, "pace": 80, "shooting": 72, "passing": 72, "dribbling": 77, "defending": 76, "physical": 75, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_341", "name": "Mohamed Salah", "position": "ST", "overall": 88, "pace": 88, "shooting": 87, "passing": 82, "dribbling": 86, "defending": 60, "physical": 72, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 60, "rarity": "Epic","photo": "/players/salah.png"},
  {"id": "real_342", "name": "Harry Kane", "position": "ST", "overall": 73, "pace": 64, "shooting": 66, "passing": 72, "dribbling": 63, "defending": 62, "physical": 69, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_343", "name": "Robert Lewandowski", "position": "ST", "overall": 90, "pace": 90, "shooting": 78, "passing": 82, "dribbling": 78, "defending": 86, "physical": 88, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_344", "name": "Bukayo Saka", "position": "ST", "overall": 85, "pace": 82, "shooting": 82, "passing": 82, "dribbling": 84, "defending": 70, "physical": 85, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_345", "name": "Lautaro Martínez", "position": "ST", "overall": 80, "pace": 74, "shooting": 72, "passing": 70, "dribbling": 77, "defending": 72, "physical": 67, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_346", "name": "Victor Osimhen", "position": "ST", "overall": 75, "pace": 66, "shooting": 62, "passing": 70, "dribbling": 70, "defending": 74, "physical": 64, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_347", "name": "Rafael Leão", "position": "ST", "overall": 92, "pace": 92, "shooting": 88, "passing": 92, "dribbling": 85, "defending": 80, "physical": 83, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_348", "name": "Rodrygo", "position": "ST", "overall": 87, "pace": 84, "shooting": 78, "passing": 80, "dribbling": 78, "defending": 82, "physical": 80, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_349", "name": "Son Heung-min", "position": "ST", "overall": 82, "pace": 76, "shooting": 82, "passing": 80, "dribbling": 71, "defending": 66, "physical": 77, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_350", "name": "Antoine Griezmann", "position": "ST", "overall": 77, "pace": 68, "shooting": 72, "passing": 68, "dribbling": 77, "defending": 68, "physical": 74, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_351", "name": "Ousmane Dembélé", "position": "ST", "overall": 72, "pace": 72, "shooting": 62, "passing": 68, "dribbling": 70, "defending": 70, "physical": 71, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_352", "name": "Luis Suárez", "position": "ST", "overall": 89, "pace": 86, "shooting": 88, "passing": 78, "dribbling": 85, "defending": 76, "physical": 75, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_353", "name": "Kareem Benzema", "position": "ST", "overall": 84, "pace": 78, "shooting": 78, "passing": 78, "dribbling": 78, "defending": 78, "physical": 72, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_354", "name": "Romelu Lukaku", "position": "ST", "overall": 79, "pace": 70, "shooting": 68, "passing": 78, "dribbling": 71, "defending": 62, "physical": 69, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_355", "name": "Darwin Núñez", "position": "ST", "overall": 74, "pace": 74, "shooting": 72, "passing": 66, "dribbling": 64, "defending": 64, "physical": 66, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_356", "name": "Alexander Isak", "position": "ST", "overall": 91, "pace": 88, "shooting": 84, "passing": 88, "dribbling": 79, "defending": 88, "physical": 85, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_357", "name": "Julian Alvarez", "position": "ST", "overall": 86, "pace": 80, "shooting": 74, "passing": 76, "dribbling": 85, "defending": 72, "physical": 82, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_358", "name": "Rasmus Højlund", "position": "ST", "overall": 81, "pace": 72, "shooting": 78, "passing": 76, "dribbling": 78, "defending": 74, "physical": 79, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_359", "name": "Victor Boniface", "position": "ST", "overall": 76, "pace": 76, "shooting": 68, "passing": 76, "dribbling": 71, "defending": 76, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_360", "name": "Jonathan David", "position": "ST", "overall": 93, "pace": 90, "shooting": 80, "passing": 86, "dribbling": 86, "defending": 82, "physical": 80, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_361", "name": "Marcus Thuram", "position": "ST", "overall": 88, "pace": 82, "shooting": 84, "passing": 86, "dribbling": 79, "defending": 84, "physical": 77, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_362", "name": "Ollie Watkins", "position": "ST", "overall": 83, "pace": 74, "shooting": 74, "passing": 74, "dribbling": 72, "defending": 68, "physical": 74, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_363", "name": "Jamie Vardy", "position": "ST", "overall": 78, "pace": 78, "shooting": 78, "passing": 74, "dribbling": 78, "defending": 70, "physical": 71, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_364", "name": "Raheem Sterling", "position": "ST", "overall": 73, "pace": 70, "shooting": 68, "passing": 62, "dribbling": 71, "defending": 72, "physical": 68, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_365", "name": "Jack Grealish", "position": "ST", "overall": 90, "pace": 84, "shooting": 80, "passing": 84, "dribbling": 86, "defending": 78, "physical": 87, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_366", "name": "Marcus Rashford", "position": "ST", "overall": 85, "pace": 76, "shooting": 84, "passing": 84, "dribbling": 79, "defending": 80, "physical": 84, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_367", "name": "Jadon Sancho", "position": "ST", "overall": 80, "pace": 80, "shooting": 74, "passing": 72, "dribbling": 72, "defending": 64, "physical": 66, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_368", "name": "Anthony Gordon", "position": "ST", "overall": 75, "pace": 72, "shooting": 64, "passing": 72, "dribbling": 65, "defending": 66, "physical": 63, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_369", "name": "Philippe Coutinho", "position": "ST", "overall": 92, "pace": 86, "shooting": 90, "passing": 82, "dribbling": 80, "defending": 90, "physical": 82, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_370", "name": "Eden Hazard", "position": "ST", "overall": 87, "pace": 78, "shooting": 80, "passing": 82, "dribbling": 86, "defending": 74, "physical": 79, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_371", "name": "Christian Benteke", "position": "ST", "overall": 82, "pace": 82, "shooting": 70, "passing": 82, "dribbling": 79, "defending": 76, "physical": 76, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_372", "name": "Wilfried Zaha", "position": "ST", "overall": 77, "pace": 74, "shooting": 74, "passing": 70, "dribbling": 72, "defending": 60, "physical": 73, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_373", "name": "Sadio Mané", "position": "ST", "overall": 72, "pace": 66, "shooting": 64, "passing": 70, "dribbling": 65, "defending": 62, "physical": 70, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_374", "name": "Didier Drogba", "position": "ST", "overall": 94, "pace": 80, "shooting": 89, "passing": 80, "dribbling": 80, "defending": 60, "physical": 89, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 90, "rarity": "Legendary","photo": "/players/drogba.png"},
  {"id": "real_375", "name": "Samuel Eto'o", "position": "ST", "overall": 95, "pace": 91, "shooting": 87, "passing": 70, "dribbling": 82, "defending": 60, "physical": 74, "awareness": 60, "catching": 60, "reflexes": 60, "diving": 60, "jumping": 70, "rarity": "Legendary"},
  {"id": "real_376", "name": "George Weah", "position": "ST", "overall": 79, "pace": 76, "shooting": 70, "passing": 68, "dribbling": 79, "defending": 72, "physical": 68, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Standard"},
  {"id": "real_377", "name": "Samuel Chukwueze", "position": "ST", "overall": 74, "pace": 68, "shooting": 74, "passing": 68, "dribbling": 72, "defending": 74, "physical": 65, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_378", "name": "Ademola Lookman", "position": "ST", "overall": 91, "pace": 82, "shooting": 86, "passing": 90, "dribbling": 87, "defending": 80, "physical": 84, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_379", "name": "Patrik Schick", "position": "ST", "overall": 86, "pace": 86, "shooting": 76, "passing": 78, "dribbling": 80, "defending": 82, "physical": 81, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_380", "name": "Adam Hložek", "position": "ST", "overall": 81, "pace": 78, "shooting": 80, "passing": 78, "dribbling": 73, "defending": 66, "physical": 78, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_381", "name": "Jan Kuchta", "position": "ST", "overall": 76, "pace": 70, "shooting": 70, "passing": 66, "dribbling": 66, "defending": 68, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_382", "name": "Raúl Jiménez", "position": "ST", "overall": 93, "pace": 84, "shooting": 82, "passing": 88, "dribbling": 81, "defending": 92, "physical": 79, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_383", "name": "Santiago Giménez", "position": "ST", "overall": 88, "pace": 88, "shooting": 86, "passing": 88, "dribbling": 87, "defending": 76, "physical": 76, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_384", "name": "Alexis Vega", "position": "ST", "overall": 83, "pace": 80, "shooting": 76, "passing": 76, "dribbling": 80, "defending": 78, "physical": 73, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_385", "name": "Julián Quiñones", "position": "ST", "overall": 78, "pace": 72, "shooting": 66, "passing": 76, "dribbling": 73, "defending": 62, "physical": 70, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_386", "name": "Guillermo Martínez", "position": "ST", "overall": 73, "pace": 64, "shooting": 70, "passing": 64, "dribbling": 66, "defending": 64, "physical": 67, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_387", "name": "Roberto Alvarado", "position": "ST", "overall": 90, "pace": 90, "shooting": 82, "passing": 86, "dribbling": 81, "defending": 88, "physical": 86, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_388", "name": "Lyle Foster", "position": "ST", "overall": 85, "pace": 82, "shooting": 72, "passing": 74, "dribbling": 74, "defending": 72, "physical": 83, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_389", "name": "Relebohile Mofokeng", "position": "ST", "overall": 80, "pace": 74, "shooting": 76, "passing": 74, "dribbling": 80, "defending": 74, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_390", "name": "Oswin Appollis", "position": "ST", "overall": 75, "pace": 66, "shooting": 66, "passing": 74, "dribbling": 73, "defending": 58, "physical": 62, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_391", "name": "Thomas Müller", "position": "ST", "overall": 92, "pace": 92, "shooting": 92, "passing": 84, "dribbling": 88, "defending": 82, "physical": 81, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_392", "name": "Leroy Sané", "position": "ST", "overall": 87, "pace": 84, "shooting": 82, "passing": 84, "dribbling": 81, "defending": 84, "physical": 78, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_393", "name": "Serge Gnabry", "position": "ST", "overall": 82, "pace": 76, "shooting": 72, "passing": 72, "dribbling": 74, "defending": 68, "physical": 75, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_394", "name": "Kai Havertz", "position": "ST", "overall": 77, "pace": 68, "shooting": 76, "passing": 72, "dribbling": 67, "defending": 70, "physical": 72, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_395", "name": "Timo Werner", "position": "ST", "overall": 72, "pace": 72, "shooting": 66, "passing": 72, "dribbling": 60, "defending": 72, "physical": 69, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_396", "name": "Marco Reus", "position": "ST", "overall": 89, "pace": 86, "shooting": 78, "passing": 82, "dribbling": 88, "defending": 78, "physical": 88, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_397", "name": "Mario Götze", "position": "ST", "overall": 84, "pace": 78, "shooting": 82, "passing": 82, "dribbling": 81, "defending": 80, "physical": 70, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_398", "name": "Miroslav Klose", "position": "ST", "overall": 79, "pace": 70, "shooting": 72, "passing": 70, "dribbling": 74, "defending": 64, "physical": 67, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_399", "name": "Robert Pires", "position": "ST", "overall": 74, "pace": 74, "shooting": 62, "passing": 70, "dribbling": 67, "defending": 66, "physical": 64, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_400", "name": "David Villa", "position": "ST", "overall": 91, "pace": 88, "shooting": 88, "passing": 80, "dribbling": 82, "defending": 90, "physical": 83, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_401", "name": "Fernando Torres", "position": "ST", "overall": 86, "pace": 80, "shooting": 78, "passing": 80, "dribbling": 75, "defending": 74, "physical": 80, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_402", "name": "Raúl González", "position": "ST", "overall": 94, "pace": 72, "shooting": 68, "passing": 80, "dribbling": 81, "defending": 76, "physical": 77, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Legendary"},
  {"id": "real_403", "name": "David Trezeguet", "position": "ST", "overall": 76, "pace": 76, "shooting": 72, "passing": 68, "dribbling": 74, "defending": 60, "physical": 74, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_404", "name": "Ronaldo Nazário", "position": "ST", "overall": 98, "pace": 90, "shooting": 97, "passing": 82, "dribbling": 89, "defending": 84, "physical": 93, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Legendary","photo": "/players/nazario.png"},
  {"id": "real_405", "name": "Rivaldo", "position": "ST", "overall": 95, "pace": 82, "shooting": 88, "passing": 78, "dribbling": 82, "defending": 86, "physical": 75, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Legendary"},
  {"id": "real_406", "name": "Romário", "position": "ST", "overall": 96, "pace": 74, "shooting": 78, "passing": 78, "dribbling": 75, "defending": 70, "physical": 72, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Legendary"},
  {"id": "real_407", "name": "Bebeto", "position": "ST", "overall": 78, "pace": 78, "shooting": 68, "passing": 78, "dribbling": 68, "defending": 72, "physical": 69, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_408", "name": "Garrincha", "position": "ST", "overall": 73, "pace": 70, "shooting": 72, "passing": 66, "dribbling": 61, "defending": 56, "physical": 66, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_409", "name": "Pelé", "position": "ST", "overall": 99, "pace": 84, "shooting": 84, "passing": 88, "dribbling": 89, "defending": 80, "physical": 85, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Legendary"},
  {"id": "real_410", "name": "Adriano", "position": "ST", "overall": 85, "pace": 76, "shooting": 74, "passing": 76, "dribbling": 82, "defending": 82, "physical": 82, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_411", "name": "Ronaldo Luís Nazário", "position": "ST", "overall": 80, "pace": 80, "shooting": 78, "passing": 76, "dribbling": 75, "defending": 66, "physical": 79, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare","photo": "/players/nazario.png"},
  {"id": "real_412", "name": "Robinho", "position": "ST", "overall": 75, "pace": 72, "shooting": 68, "passing": 64, "dribbling": 68, "defending": 68, "physical": 61, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_413", "name": "Gabriel Martinelli", "position": "ST", "overall": 92, "pace": 86, "shooting": 80, "passing": 86, "dribbling": 83, "defending": 92, "physical": 80, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_414", "name": "Gabriel Jesus", "position": "ST", "overall": 87, "pace": 78, "shooting": 84, "passing": 86, "dribbling": 76, "defending": 76, "physical": 77, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_415", "name": "Richarlison", "position": "ST", "overall": 82, "pace": 82, "shooting": 74, "passing": 74, "dribbling": 82, "defending": 78, "physical": 74, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_416", "name": "Endrick", "position": "ST", "overall": 77, "pace": 74, "shooting": 64, "passing": 74, "dribbling": 75, "defending": 62, "physical": 71, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_417", "name": "Estevão", "position": "ST", "overall": 72, "pace": 66, "shooting": 68, "passing": 62, "dribbling": 68, "defending": 64, "physical": 68, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_418", "name": "Matheus Cunha", "position": "ST", "overall": 89, "pace": 80, "shooting": 80, "passing": 84, "dribbling": 83, "defending": 88, "physical": 87, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_419", "name": "Raphinha", "position": "ST", "overall": 84, "pace": 84, "shooting": 84, "passing": 84, "dribbling": 76, "defending": 72, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_420", "name": "Gabriel Barbosa", "position": "ST", "overall": 79, "pace": 76, "shooting": 74, "passing": 72, "dribbling": 69, "defending": 74, "physical": 66, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Standard"},
  {"id": "real_421", "name": "Pedro", "position": "ST", "overall": 74, "pace": 68, "shooting": 64, "passing": 72, "dribbling": 62, "defending": 58, "physical": 63, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_422", "name": "Everton Ribeiro", "position": "ST", "overall": 91, "pace": 82, "shooting": 90, "passing": 82, "dribbling": 90, "defending": 82, "physical": 82, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_423", "name": "Éverton Cebolinha", "position": "ST", "overall": 86, "pace": 86, "shooting": 80, "passing": 82, "dribbling": 83, "defending": 84, "physical": 79, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_424", "name": "Lucas Moura", "position": "ST", "overall": 81, "pace": 78, "shooting": 70, "passing": 70, "dribbling": 76, "defending": 68, "physical": 76, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_425", "name": "Antony", "position": "ST", "overall": 76, "pace": 70, "shooting": 74, "passing": 70, "dribbling": 69, "defending": 70, "physical": 73, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_426", "name": "Willian", "position": "ST", "overall": 93, "pace": 84, "shooting": 86, "passing": 92, "dribbling": 84, "defending": 76, "physical": 92, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_427", "name": "Malcom", "position": "ST", "overall": 88, "pace": 88, "shooting": 76, "passing": 80, "dribbling": 77, "defending": 78, "physical": 74, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_428", "name": "Luiz Adriano", "position": "ST", "overall": 83, "pace": 80, "shooting": 80, "passing": 80, "dribbling": 83, "defending": 80, "physical": 71, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_429", "name": "Alexandre Pato", "position": "ST", "overall": 78, "pace": 72, "shooting": 70, "passing": 68, "dribbling": 76, "defending": 64, "physical": 68, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_430", "name": "Firmino", "position": "ST", "overall": 73, "pace": 64, "shooting": 60, "passing": 68, "dribbling": 69, "defending": 66, "physical": 65, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_431", "name": "Diego Costa", "position": "ST", "overall": 90, "pace": 90, "shooting": 86, "passing": 90, "dribbling": 84, "defending": 90, "physical": 84, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_432", "name": "Gonzalo Higuaín", "position": "ST", "overall": 85, "pace": 82, "shooting": 76, "passing": 78, "dribbling": 77, "defending": 74, "physical": 81, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_433", "name": "Mauro Icardi", "position": "ST", "overall": 80, "pace": 74, "shooting": 80, "passing": 78, "dribbling": 70, "defending": 76, "physical": 78, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_434", "name": "Edinson Cavani", "position": "ST", "overall": 75, "pace": 66, "shooting": 70, "passing": 66, "dribbling": 63, "defending": 60, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_435", "name": "Lucas Ocampos", "position": "ST", "overall": 92, "pace": 92, "shooting": 82, "passing": 88, "dribbling": 91, "defending": 84, "physical": 79, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_436", "name": "Alexis Sánchez", "position": "ST", "overall": 87, "pace": 84, "shooting": 86, "passing": 76, "dribbling": 84, "defending": 86, "physical": 76, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_437", "name": "Arturo Vidal", "position": "ST", "overall": 82, "pace": 76, "shooting": 76, "passing": 76, "dribbling": 77, "defending": 70, "physical": 73, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_438", "name": "Claudio Pizarro", "position": "ST", "overall": 77, "pace": 68, "shooting": 66, "passing": 76, "dribbling": 70, "defending": 72, "physical": 70, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_439", "name": "Paolo Guerrero", "position": "ST", "overall": 72, "pace": 72, "shooting": 70, "passing": 64, "dribbling": 63, "defending": 56, "physical": 67, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_440", "name": "Jefferson Farfán", "position": "ST", "overall": 89, "pace": 86, "shooting": 82, "passing": 86, "dribbling": 78, "defending": 80, "physical": 86, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_441", "name": "Enner Valencia", "position": "ST", "overall": 84, "pace": 78, "shooting": 72, "passing": 74, "dribbling": 84, "defending": 82, "physical": 83, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_442", "name": "Michael Estrada", "position": "ST", "overall": 79, "pace": 70, "shooting": 76, "passing": 74, "dribbling": 77, "defending": 66, "physical": 65, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_443", "name": "Salomón Rondón", "position": "ST", "overall": 74, "pace": 74, "shooting": 66, "passing": 74, "dribbling": 70, "defending": 68, "physical": 62, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_444", "name": "Luis Díaz", "position": "ST", "overall": 91, "pace": 88, "shooting": 78, "passing": 84, "dribbling": 85, "defending": 74, "physical": 81, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_445", "name": "Jhon Durán", "position": "ST", "overall": 86, "pace": 80, "shooting": 82, "passing": 84, "dribbling": 78, "defending": 76, "physical": 78, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_446", "name": "Rafael Santos Borré", "position": "ST", "overall": 81, "pace": 72, "shooting": 72, "passing": 72, "dribbling": 71, "defending": 78, "physical": 75, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_447", "name": "Radamel Falcao", "position": "ST", "overall": 76, "pace": 76, "shooting": 76, "passing": 72, "dribbling": 64, "defending": 62, "physical": 72, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_448", "name": "Carlos Bacca", "position": "ST", "overall": 93, "pace": 90, "shooting": 88, "passing": 82, "dribbling": 92, "defending": 86, "physical": 91, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_449", "name": "Hugo Sánchez", "position": "ST", "overall": 88, "pace": 82, "shooting": 78, "passing": 82, "dribbling": 85, "defending": 88, "physical": 88, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_450", "name": "Cuauhtémoc Blanco", "position": "ST", "overall": 83, "pace": 74, "shooting": 82, "passing": 82, "dribbling": 78, "defending": 72, "physical": 70, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_451", "name": "Chicharito Hernández", "position": "ST", "overall": 78, "pace": 78, "shooting": 72, "passing": 70, "dribbling": 71, "defending": 74, "physical": 67, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_452", "name": "Oribe Peralta", "position": "ST", "overall": 73, "pace": 70, "shooting": 62, "passing": 70, "dribbling": 64, "defending": 58, "physical": 64, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_453", "name": "Giovani dos Santos", "position": "ST", "overall": 90, "pace": 84, "shooting": 88, "passing": 80, "dribbling": 79, "defending": 82, "physical": 83, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_454", "name": "Carlos Vela", "position": "ST", "overall": 85, "pace": 76, "shooting": 78, "passing": 80, "dribbling": 85, "defending": 84, "physical": 80, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_455", "name": "Landón Donovan", "position": "ST", "overall": 80, "pace": 80, "shooting": 68, "passing": 80, "dribbling": 78, "defending": 68, "physical": 77, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_456", "name": "Jozy Altidore", "position": "ST", "overall": 75, "pace": 72, "shooting": 72, "passing": 68, "dribbling": 71, "defending": 70, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_457", "name": "Folarin Balogun", "position": "ST", "overall": 92, "pace": 86, "shooting": 84, "passing": 90, "dribbling": 86, "defending": 76, "physical": 78, "awareness": 92, "catching": 92, "reflexes": 92, "diving": 92, "jumping": 92, "rarity": "Epic"},
  {"id": "real_458", "name": "Divock Origi", "position": "ST", "overall": 87, "pace": 78, "shooting": 74, "passing": 78, "dribbling": 79, "defending": 78, "physical": 75, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_459", "name": "Leandro Trossard", "position": "ST", "overall": 82, "pace": 82, "shooting": 78, "passing": 78, "dribbling": 72, "defending": 80, "physical": 72, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_460", "name": "Loïs Openda", "position": "ST", "overall": 77, "pace": 74, "shooting": 68, "passing": 66, "dribbling": 65, "defending": 64, "physical": 69, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_461", "name": "Jeremy Doku", "position": "ST", "overall": 72, "pace": 66, "shooting": 72, "passing": 66, "dribbling": 71, "defending": 66, "physical": 66, "awareness": 72, "catching": 72, "reflexes": 72, "diving": 72, "jumping": 72, "rarity": "Standard"},
  {"id": "real_462", "name": "Charles De Ketelaere", "position": "ST", "overall": 89, "pace": 80, "shooting": 84, "passing": 88, "dribbling": 86, "defending": 72, "physical": 85, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_463", "name": "Arjen Robben", "position": "ST", "overall": 84, "pace": 84, "shooting": 74, "passing": 76, "dribbling": 79, "defending": 74, "physical": 82, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_464", "name": "Robin van Persie", "position": "ST", "overall": 79, "pace": 76, "shooting": 78, "passing": 76, "dribbling": 72, "defending": 76, "physical": 79, "awareness": 79, "catching": 79, "reflexes": 79, "diving": 79, "jumping": 79, "rarity": "Rare"},
  {"id": "real_465", "name": "Cristiano Ronaldo", "position": "ST", "overall": 99, "pace": 94, "shooting": 95, "passing": 84, "dribbling": 90, "defending": 60, "physical": 85, "awareness": 54, "catching": 54, "reflexes": 54, "diving": 54, "jumping": 88, "rarity": "Legendary", "photo": "/players/cristiano.png"},
  {"id": "real_466", "name": "Neymar", "position": "LW", "overall": 91, "pace": 82, "shooting": 80, "passing": 86, "dribbling": 80, "defending": 84, "physical": 80, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic","photo": "/players/neymar.png"},
  {"id": "real_467", "name": "Karim Benzema", "position": "ST", "overall": 86, "pace": 86, "shooting": 84, "passing": 86, "dribbling": 86, "defending": 86, "physical": 77, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_468", "name": "Sergio Agüero", "position": "ST", "overall": 81, "pace": 78, "shooting": 74, "passing": 74, "dribbling": 79, "defending": 70, "physical": 74, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_469", "name": "Gareth Bale", "position": "RW", "overall": 76, "pace": 70, "shooting": 64, "passing": 74, "dribbling": 72, "defending": 72, "physical": 71, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_470", "name": "Eusébio", "position": "ST", "overall": 93, "pace": 84, "shooting": 90, "passing": 84, "dribbling": 87, "defending": 78, "physical": 90, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Epic"},
  {"id": "real_471", "name": "Ferenc Puskás", "position": "ST", "overall": 98, "pace": 88, "shooting": 80, "passing": 84, "dribbling": 80, "defending": 80, "physical": 87, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Legendary"},
  {"id": "real_472", "name": "Johan Cruyff", "position": "CF", "overall": 98, "pace": 80, "shooting": 70, "passing": 72, "dribbling": 73, "defending": 82, "physical": 69, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Legendary"},
  {"id": "real_473", "name": "Marco van Basten", "position": "ST", "overall": 96, "pace": 72, "shooting": 74, "passing": 72, "dribbling": 66, "defending": 66, "physical": 66, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Legendary"},
  {"id": "real_474", "name": "George Best", "position": "LW", "overall": 96, "pace": 64, "shooting": 64, "passing": 72, "dribbling": 72, "defending": 68, "physical": 63, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Legendary"},
  {"id": "real_475", "name": "Bobby Charlton", "position": "CM", "overall": 90, "pace": 90, "shooting": 90, "passing": 82, "dribbling": 87, "defending": 74, "physical": 82, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_476", "name": "Javier Zanetti", "position": "RB", "overall": 94, "pace": 82, "shooting": 80, "passing": 82, "dribbling": 80, "defending": 76, "physical": 79, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Legendary"},
  {"id": "real_477", "name": "Lothar Matthäus", "position": "CM", "overall": 97, "pace": 74, "shooting": 70, "passing": 70, "dribbling": 73, "defending": 78, "physical": 76, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Legendary"},
  {"id": "real_478", "name": "Andrés Iniesta", "position": "CM", "overall": 96, "pace": 66, "shooting": 74, "passing": 70, "dribbling": 66, "defending": 62, "physical": 73, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Legendary","photo": "/players/iniesta.png"},
  {"id": "real_479", "name": "Dino Zoff", "position": "GK", "overall": 92, "awareness": 92, "catching": 93, "reflexes": 94, "diving": 93, "jumping": 90, "physical": 91, "pace": 77, "shooting": 25, "passing": 84, "dribbling": 74, "defending": 72, "rarity": "Epic"},
  {"id": "real_480", "name": "Lev Yashin", "position": "GK", "overall": 97, "awareness": 87, "catching": 88, "reflexes": 89, "diving": 88, "jumping": 85, "physical": 86, "pace": 72, "shooting": 25, "passing": 79, "dribbling": 69, "defending": 67, "rarity": "Legendary"},
  {"id": "real_481", "name": "Sepp Maier", "position": "GK", "overall": 82, "awareness": 82, "catching": 83, "reflexes": 84, "diving": 83, "jumping": 80, "physical": 81, "pace": 67, "shooting": 25, "passing": 74, "dribbling": 64, "defending": 62, "rarity": "Rare"},
  {"id": "real_482", "name": "Gordon Banks", "position": "GK", "overall": 95, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "physical": 76, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 57, "rarity": "Legendary"},
  {"id": "real_483", "name": "Ray Clemence", "position": "GK", "overall": 72, "awareness": 72, "catching": 73, "reflexes": 74, "diving": 73, "jumping": 70, "physical": 71, "pace": 57, "shooting": 25, "passing": 64, "dribbling": 54, "defending": 52, "rarity": "Standard"},
  {"id": "real_484", "name": "Peter Shilton", "position": "GK", "overall": 89, "awareness": 89, "catching": 90, "reflexes": 91, "diving": 90, "jumping": 87, "physical": 88, "pace": 74, "shooting": 25, "passing": 81, "dribbling": 71, "defending": 69, "rarity": "Epic"},
  {"id": "real_485", "name": "Walter Zenga", "position": "GK", "overall": 84, "awareness": 84, "catching": 85, "reflexes": 86, "diving": 85, "jumping": 82, "physical": 83, "pace": 69, "shooting": 25, "passing": 76, "dribbling": 66, "defending": 64, "rarity": "Rare"},
  {"id": "real_486", "name": "Gianluca Pagliuca", "position": "GK", "overall": 79, "awareness": 79, "catching": 80, "reflexes": 81, "diving": 80, "jumping": 77, "physical": 78, "pace": 64, "shooting": 25, "passing": 71, "dribbling": 61, "defending": 59, "rarity": "Standard"},
  {"id": "real_487", "name": "Claudio Taffarel", "position": "GK", "overall": 74, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "physical": 73, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 54, "rarity": "Standard"},
  {"id": "real_488", "name": "Roy Keane", "position": "CM", "overall": 91, "pace": 88, "shooting": 82, "passing": 88, "dribbling": 88, "defending": 76, "physical": 79, "awareness": 91, "catching": 91, "reflexes": 91, "diving": 91, "jumping": 91, "rarity": "Epic"},
  {"id": "real_489", "name": "Ryan Giggs", "position": "LM", "overall": 86, "pace": 80, "shooting": 86, "passing": 76, "dribbling": 81, "defending": 78, "physical": 76, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Rare"},
  {"id": "real_490", "name": "Luis Figo", "position": "RW", "overall": 94, "pace": 76, "shooting": 66, "passing": 76, "dribbling": 67, "defending": 64, "physical": 70, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Legendary"},
  {"id": "real_491", "name": "Pavel Nedvěd", "position": "LM", "overall": 94, "pace": 90, "shooting": 92, "passing": 86, "dribbling": 82, "defending": 88, "physical": 89, "awareness": 93, "catching": 93, "reflexes": 93, "diving": 93, "jumping": 93, "rarity": "Legendary"},
  {"id": "real_492", "name": "Ruud Gullit", "position": "CM", "overall": 96, "pace": 82, "shooting": 82, "passing": 86, "dribbling": 88, "defending": 72, "physical": 86, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Legendary"},
  {"id": "real_493", "name": "Rui Costa", "position": "CAM", "overall": 83, "pace": 74, "shooting": 72, "passing": 74, "dribbling": 81, "defending": 74, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_494", "name": "Dennis Bergkamp", "position": "CF", "overall": 78, "pace": 78, "shooting": 76, "passing": 74, "dribbling": 74, "defending": 76, "physical": 65, "awareness": 78, "catching": 78, "reflexes": 78, "diving": 78, "jumping": 78, "rarity": "Standard"},
  {"id": "real_495", "name": "Thierry Henry", "position": "ST", "overall": 95, "pace": 70, "shooting": 66, "passing": 62, "dribbling": 67, "defending": 60, "physical": 62, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Legendary","photo": "/players/henry.png"},
  {"id": "real_496", "name": "Andriy Shevchenko", "position": "ST", "overall": 85, "pace": 76, "shooting": 82, "passing": 84, "dribbling": 75, "defending": 68, "physical": 78, "awareness": 85, "catching": 85, "reflexes": 85, "diving": 85, "jumping": 85, "rarity": "Rare"},
  {"id": "real_497", "name": "Filippo Inzaghi", "position": "ST", "overall": 80, "pace": 80, "shooting": 72, "passing": 72, "dribbling": 68, "defending": 70, "physical": 75, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_498", "name": "Giorgi Mamardashvili", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_499", "name": "Bernd Leno", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_500", "name": "David Ospina", "position": "GK", "overall": 76, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 58, "physical": 75, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "rarity": "Standard"},
  {"id": "real_501", "name": "Guglielmo Vicario", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_502", "name": "Alexander Nübel", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_503", "name": "Sergio Herrera", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_504", "name": "Álvaro Valles", "position": "GK", "overall": 76, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 58, "physical": 75, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "rarity": "Standard"},
  {"id": "real_505", "name": "Fernando Pacheco", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_506", "name": "Rui Silva", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_507", "name": "Marko Dmitrović", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_508", "name": "Dominik Livaković", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_509", "name": "Mile Svilar", "position": "GK", "overall": 76, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 58, "physical": 75, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "rarity": "Standard"},
  {"id": "real_510", "name": "Wladimiro Falcone", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_511", "name": "Vanja Milinković-Savić", "position": "GK", "overall": 76, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 58, "physical": 75, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "rarity": "Standard"},
  {"id": "real_512", "name": "Predrag Rajković", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_513", "name": "Nikola Vasilj", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_514", "name": "Roman Bürki", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_515", "name": "Yvon Mvogo", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_516", "name": "Matz Sels", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_517", "name": "Koen Casteels", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_518", "name": "Maarten Vandevoordt", "position": "GK", "overall": 76, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 58, "physical": 75, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "rarity": "Standard"},
  {"id": "real_519", "name": "Senne Lammens", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_520", "name": "Justin Bijlow", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_521", "name": "Mark Flekken", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_522", "name": "Andries Noppert", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_523", "name": "Nick Olij", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_524", "name": "Robin Olsen", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_525", "name": "Kristoffer Nordfeldt", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_526", "name": "Ørjan Nyland", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_527", "name": "Mathias Høegh Andersen", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_528", "name": "Kasper Schmeichel", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_529", "name": "Frederik Rønnow", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_530", "name": "Mads Hermansen", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_531", "name": "Oliver Christensen", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_532", "name": "Pavao Pervan", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_533", "name": "Alexander Schlager", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_534", "name": "Kevin Trapp", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_535", "name": "Oliver Baumann", "position": "GK", "overall": 76, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 58, "physical": 75, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "rarity": "Standard"},
  {"id": "real_536", "name": "Finn Dahmen", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_537", "name": "Moritz Nicolas", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_538", "name": "Stefan Ortega", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_539", "name": "Lukas Hradecky", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_540", "name": "Marwin Hitz", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_541", "name": "Marius Müller", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_542", "name": "Daniel Peretz", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_543", "name": "Clemens Riedel", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_544", "name": "Diant Ramaj", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_545", "name": "Kjell Peersman", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_546", "name": "Maarten Paes", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_547", "name": "Eloy Room", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_548", "name": "Mattia Perin", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_549", "name": "Alex Meret", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_550", "name": "Ivan Provedel", "position": "GK", "overall": 76, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 58, "physical": 75, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "rarity": "Standard"},
  {"id": "real_551", "name": "Marco Carnesecchi", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_552", "name": "Pierluigi Gollini", "position": "GK", "overall": 76, "pace": 61, "shooting": 25, "passing": 68, "dribbling": 58, "defending": 58, "physical": 75, "awareness": 76, "catching": 77, "reflexes": 78, "diving": 77, "jumping": 74, "rarity": "Standard"},
  {"id": "real_553", "name": "Lorenzo Montipò", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_554", "name": "Emil Audero", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_555", "name": "Radosław Majecki", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_556", "name": "Brice Samba", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_557", "name": "Alban Lafont", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_558", "name": "Steve Mandanda", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_559", "name": "Mory Diaw", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_560", "name": "Yehvann Diouf", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_561", "name": "Guillaume Restes", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_562", "name": "Iñaki Peña", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_563", "name": "Álvaro Fernández", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_564", "name": "Agirrezabala", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_565", "name": "Leo Román", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_566", "name": "Filip Jörgensen", "position": "GK", "overall": 74, "pace": 59, "shooting": 25, "passing": 66, "dribbling": 56, "defending": 56, "physical": 73, "awareness": 74, "catching": 75, "reflexes": 76, "diving": 75, "jumping": 72, "rarity": "Standard"},
  {"id": "real_567", "name": "André Ferreira", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_568", "name": "Diogo Pinto", "position": "GK", "overall": 75, "pace": 60, "shooting": 25, "passing": 67, "dribbling": 57, "defending": 57, "physical": 74, "awareness": 75, "catching": 76, "reflexes": 77, "diving": 76, "jumping": 73, "rarity": "Standard"},
  {"id": "real_569", "name": "José Marafona", "position": "GK", "overall": 73, "pace": 58, "shooting": 25, "passing": 65, "dribbling": 55, "defending": 55, "physical": 72, "awareness": 73, "catching": 74, "reflexes": 75, "diving": 74, "jumping": 71, "rarity": "Standard"},
  {"id": "real_570", "name": "Beto", "position": "GK", "overall": 77, "pace": 62, "shooting": 25, "passing": 69, "dribbling": 59, "defending": 59, "physical": 76, "awareness": 77, "catching": 78, "reflexes": 79, "diving": 78, "jumping": 75, "rarity": "Standard"},
  {"id": "real_571", "name": "Loïc Badé", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_572", "name": "Castello Lukeba", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_573", "name": "Maxence Lacroix", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_574", "name": "Oumar Solet", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_575", "name": "Mohamed Simakan", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_576", "name": "Waldemar Anton", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_577", "name": "Nico Schlotterbeck", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_578", "name": "Niklas Süle", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_579", "name": "Nico Elvedi", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_580", "name": "Manuel Akanji", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_581", "name": "Maximilian Wöber", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_582", "name": "Kevin Danso", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_583", "name": "Stefan Posch", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_584", "name": "Philipp Lienhart", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_585", "name": "Maximilian Mittelstädt", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_586", "name": "Gonçalo Inácio", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_587", "name": "David Carmo", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_588", "name": "Renato Veiga", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_589", "name": "Tosin Adarabioyo", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_590", "name": "Lewis Dunk", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_591", "name": "Trevoh Chalobah", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_592", "name": "Malick Thiaw", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_593", "name": "Strahinja Pavlović", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_594", "name": "Nemanja Gudelj", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_595", "name": "Martin Vitík", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_596", "name": "David Hancko", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_597", "name": "Jakub Kiwior", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_598", "name": "Jan Bednarek", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_599", "name": "Perr Schuurs", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_600", "name": "Sam Beukema", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_601", "name": "Josip Šutalo", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_602", "name": "Devyne Rensch", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_603", "name": "Jorrel Hato", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_604", "name": "Micky van de Ven", "position": "CB", "overall": 89, "pace": 82, "shooting": 74, "passing": 84, "dribbling": 81, "defending": 91, "physical": 89, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_605", "name": "Sepp van den Berg", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_606", "name": "Facundo Medina", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_607", "name": "Lisandro Martínez", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_608", "name": "Germán Pezzella", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_609", "name": "Leonardo Balerdi", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_610", "name": "Lucas Martínez Quarta", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_611", "name": "Gonzalo Montiel", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_612", "name": "Nahuel Molina", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_613", "name": "Marcos Senesi", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_614", "name": "Nehuén Pérez", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_615", "name": "Walter Kannemann", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_616", "name": "Murillo Santiago", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_617", "name": "Murillo", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_618", "name": "Natan", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_619", "name": "Fabrício Bruno", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_620", "name": "Léo Ortiz", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_621", "name": "Thiago Heleno", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_622", "name": "Luan Peres", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_623", "name": "Felipe", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_624", "name": "Robert Arboleda", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_625", "name": "Piero Hincapié", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_626", "name": "Willian Pacho", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_627", "name": "Jackson Porozo", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_628", "name": "Carlos Cuesta", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_629", "name": "Davinson Sánchez", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_630", "name": "Yerry Mina", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_631", "name": "Jhon Lucumí", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_632", "name": "Daniel Muñoz", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_633", "name": "Kevin Mantilla", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_634", "name": "Juan David Fuentes", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_635", "name": "Yeimar Gómez", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_636", "name": "Johan Vásquez", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_637", "name": "César Montes", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_638", "name": "Érick Aguirre", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_639", "name": "Jesús Orozco Chiquete", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_640", "name": "César Huerta", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_641", "name": "Néstor Araujo", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_642", "name": "Héctor Moreno", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_643", "name": "Jorge Sánchez", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_644", "name": "Kevin Álvarez", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_645", "name": "Brayan Ceballos", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_646", "name": "Andreas Christensen", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_647", "name": "Joachim Andersen", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_648", "name": "Victor Nelsson", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_649", "name": "Simon Kjær", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_650", "name": "Rasmus Kristensen", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_651", "name": "Joakim Mæhle", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_652", "name": "Victor Lindelöf", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_653", "name": "Pontus Jansson", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_654", "name": "Carl Starfelt", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_655", "name": "Hjalmar Ekdal", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_656", "name": "Leo Väisänen", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_657", "name": "Isak Hien", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_658", "name": "Kristoffer Ajer", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_659", "name": "Leo Østigård", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_660", "name": "Shkodran Mustafi", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_661", "name": "Sokratis Papastathopoulos", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_662", "name": "Kostas Manolas", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_663", "name": "Sergi Gómez", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_664", "name": "Marc Bartra", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_665", "name": "Eric García", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_666", "name": "Unai Núñez", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_667", "name": "David García", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_668", "name": "Jorge Cuenca", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_669", "name": "Chadi Riad", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_670", "name": "Cristhian Mosquera", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_671", "name": "Mika Mármol", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_672", "name": "Mario Hermoso", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_673", "name": "Diego Llorente", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_674", "name": "Pau Cubarsí", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_675", "name": "Nikola Milenković", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_676", "name": "Koni De Winter", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_677", "name": "Arthur Theate", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_678", "name": "Wout Faes", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_679", "name": "Zeno Debast", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_680", "name": "Ameen Al-Dakhil", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_681", "name": "Abakar Sylla", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_682", "name": "Evan Ndicka", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_683", "name": "Chrislain Matsima", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_684", "name": "Benoît Badiashile", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_685", "name": "Axel Disasi", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_686", "name": "Wesley Fofana", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_687", "name": "Boubacar Kamara", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_688", "name": "Nayef Aguerd", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_689", "name": "Romain Saïss", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_690", "name": "Achraf Dari", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_691", "name": "Jawad El Yamiq", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_692", "name": "Chancel Mbemba", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_693", "name": "Aissa Mandi", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_694", "name": "Rami Bensebaini", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_695", "name": "Mohamed Abdelmonem", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_696", "name": "Ahmed Hegazi", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_697", "name": "Ali Gabr", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_698", "name": "Yasser Ibrahim", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_699", "name": "Osama Idrissi", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_700", "name": "Montassar Talbi", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_701", "name": "Yassine Meriah", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_702", "name": "Dylan Bronn", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_703", "name": "Merih Demiral", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_704", "name": "Abdülkerim Bardakcı", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_705", "name": "Kaan Ayhan", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_706", "name": "Çağlar Söyüncü", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_707", "name": "Ozan Kabak", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_708", "name": "Samet Akaydin", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_709", "name": "Kim Young-gwon", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_710", "name": "Kwon Kyung-won", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_711", "name": "Cho Yu-min", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_712", "name": "Takehiro Tomiyasu", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_713", "name": "Ko Itakura", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_714", "name": "Maya Yoshida", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_715", "name": "Hiroki Ito", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_716", "name": "Shogo Taniguchi", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_717", "name": "Yukinari Sugawara", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_718", "name": "Daiki Hashioka", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_719", "name": "Wataru Endo", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_720", "name": "Takuya Ogiwara", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_721", "name": "Junya Ito", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_722", "name": "Seiji Kimura", "position": "CB", "overall": 77, "pace": 70, "shooting": 62, "passing": 72, "dribbling": 69, "defending": 79, "physical": 77, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_723", "name": "Lee Kang-in", "position": "CB", "overall": 86, "pace": 79, "shooting": 71, "passing": 81, "dribbling": 78, "defending": 88, "physical": 86, "awareness": 86, "catching": 86, "reflexes": 86, "diving": 86, "jumping": 86, "rarity": "Epic"},
  {"id": "real_724", "name": "Kim Moon-hwan", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_725", "name": "Park Min-gyu", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_726", "name": "Kang Min-jae", "position": "CB", "overall": 76, "pace": 69, "shooting": 61, "passing": 71, "dribbling": 68, "defending": 78, "physical": 76, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_727", "name": "Ali Al-Bulaihi", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_728", "name": "Abdulelah Al-Amri", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_729", "name": "Hassan Tambakti", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_730", "name": "Saud Abdulhamid", "position": "CB", "overall": 75, "pace": 68, "shooting": 60, "passing": 70, "dribbling": 67, "defending": 77, "physical": 75, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_731", "name": "Yasser Al-Shahrani", "position": "CB", "overall": 73, "pace": 66, "shooting": 58, "passing": 68, "dribbling": 65, "defending": 75, "physical": 73, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_732", "name": "Mohammed Al-Breik", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_733", "name": "Abdulkerim Bardakci", "position": "CB", "overall": 74, "pace": 67, "shooting": 59, "passing": 69, "dribbling": 66, "defending": 76, "physical": 74, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_734", "name": "Rayan Aït-Nouri", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_735", "name": "Milos Kerkez", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_736", "name": "Patrick Dorgu", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_737", "name": "Destiny Udogie", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_738", "name": "Timothy Castagne", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_739", "name": "Vanderson", "position": "LB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_740", "name": "Vladimir Coufal", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_741", "name": "David Jurásek", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_742", "name": "Milos Veljkovic", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_743", "name": "Benjamin Henrichs", "position": "LB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_744", "name": "Matty Cash", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_745", "name": "Tino Livramento", "position": "LB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_746", "name": "Aaron Wan-Bissaka", "position": "RB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_747", "name": "Tyrick Mitchell", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_748", "name": "Lewis Hall", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_749", "name": "Luke Thomas", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_750", "name": "Sergio Reguilón", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_751", "name": "Fran García", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_752", "name": "Miguel Gutiérrez", "position": "RB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_753", "name": "Iván Fresneda", "position": "LB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_754", "name": "Hugo Bueno", "position": "RB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_755", "name": "Sergio Akieme", "position": "LB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_756", "name": "Álex Centelles", "position": "RB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_757", "name": "Arnau Martínez", "position": "LB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_758", "name": "Marc Pubill", "position": "RB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_759", "name": "Jesús Navas", "position": "LB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_760", "name": "Pedro Porro", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_761", "name": "Ander Capa", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_762", "name": "Juan Foyth", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_763", "name": "Marcos Rojo", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_764", "name": "Fabrizio Angileri", "position": "RB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_765", "name": "Valentín Barco", "position": "LB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_766", "name": "Lucas Esquivel", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_767", "name": "Enzo Díaz", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_768", "name": "Francisco Ortega", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_769", "name": "Agustín Giay", "position": "LB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_770", "name": "Ángelo Preciado", "position": "RB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_771", "name": "Moisés Caicedo", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_772", "name": "Kervin Andrade", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_773", "name": "Miguel Trauco", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_774", "name": "Luis Advíncula", "position": "RB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_775", "name": "Miguel Araujo", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_776", "name": "Renato Tapia", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_777", "name": "Luis Abram", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_778", "name": "Alexander Callens", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_779", "name": "Juan Mosquera", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_780", "name": "Johan Mojica", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_781", "name": "Cristian Borja", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_782", "name": "Deiver Machado", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_783", "name": "Gabriel Suazo", "position": "LB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_784", "name": "Guillermo Maripán", "position": "RB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_785", "name": "Mauricio Isla", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_786", "name": "Thomas Meunier", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_787", "name": "Arthur Masuaku", "position": "LB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_788", "name": "Timothy Weah", "position": "RB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_789", "name": "Sergio Gómez", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_790", "name": "Sergiño Dest", "position": "RB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_791", "name": "Joe Scally", "position": "LB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_792", "name": "Antonee Robinson", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_793", "name": "Kristoffer Lund", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_794", "name": "DeAndre Yedlin", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_795", "name": "Reggie Cannon", "position": "LB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_796", "name": "Cameron Carter-Vickers", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_797", "name": "Miles Robinson", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_798", "name": "Shaq Moore", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_799", "name": "Julián Araujo", "position": "LB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_800", "name": "Bryan Reynolds", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_801", "name": "Alistair Johnston", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_802", "name": "Alphonso Davies", "position": "RB", "overall": 82, "pace": 85, "shooting": 74, "passing": 80, "dribbling": 82, "defending": 82, "physical": 81, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_803", "name": "Richmond Laryea", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_804", "name": "Sam Adekugbe", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_805", "name": "Tajon Buchanan", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_806", "name": "Owen Wijndal", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_807", "name": "Ian Maatsen", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_808", "name": "Jorrit Hendrix", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_809", "name": "Rico Lewis", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_810", "name": "Kyle Walker-Peters", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_811", "name": "Max Aarons", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_812", "name": "Ben Johnson", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_813", "name": "Valentino Livramento", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_814", "name": "Josh Doig", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_815", "name": "Calvin Bassey", "position": "LB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_816", "name": "Bright Osayi-Samuel", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_817", "name": "Zaidu Sanusi", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_818", "name": "Moses Simon", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_819", "name": "Ola Aina", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_820", "name": "William Troost-Ekong", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_821", "name": "Tyronne Ebuehi", "position": "LB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_822", "name": "Jordan Torunarigha", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_823", "name": "Salisu Mohammed", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_824", "name": "Gideon Mensah", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_825", "name": "Dennis Odoi", "position": "LB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_826", "name": "Elisha Owusu", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_827", "name": "Baba Rahman", "position": "LB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_828", "name": "Majeed Ashimeru", "position": "RB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_829", "name": "Ali Maaloul", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_830", "name": "Mohamed Hany", "position": "RB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_831", "name": "Omar Kamal", "position": "LB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_832", "name": "Ahmed Fatouh", "position": "RB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_833", "name": "Karim Fouad", "position": "LB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_834", "name": "Mohamed Hamdy", "position": "RB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_835", "name": "Ayman Ashraf", "position": "LB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_836", "name": "Hamdi Fathi", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_837", "name": "Yehia Atiya Allah", "position": "LB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_838", "name": "Youssef En-Nesyri", "position": "RB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_839", "name": "Omar Richards", "position": "LB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_840", "name": "Hidemasa Morita", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_841", "name": "Ritsu Doan", "position": "LB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_842", "name": "Daichi Kamada", "position": "RB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_843", "name": "Kaoru Mitoma", "position": "LB", "overall": 87, "pace": 90, "shooting": 79, "passing": 85, "dribbling": 87, "defending": 87, "physical": 86, "awareness": 87, "catching": 87, "reflexes": 87, "diving": 87, "jumping": 87, "rarity": "Epic"},
  {"id": "real_844", "name": "Yuto Nagatomo", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_845", "name": "Hiroki Sakai", "position": "LB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_846", "name": "Sei Muroya", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_847", "name": "Koki Machida", "position": "LB", "overall": 77, "pace": 80, "shooting": 69, "passing": 75, "dribbling": 77, "defending": 77, "physical": 76, "awareness": 77, "catching": 77, "reflexes": 77, "diving": 77, "jumping": 77, "rarity": "Standard"},
  {"id": "real_848", "name": "Shuto Tanabe", "position": "RB", "overall": 73, "pace": 76, "shooting": 65, "passing": 71, "dribbling": 73, "defending": 73, "physical": 72, "awareness": 73, "catching": 73, "reflexes": 73, "diving": 73, "jumping": 73, "rarity": "Standard"},
  {"id": "real_849", "name": "Kim Jin-su", "position": "LB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_850", "name": "Kim Tae-hwan", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_851", "name": "Lee Ki-je", "position": "LB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_852", "name": "Park Joo-ho", "position": "RB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_853", "name": "Oh Hyeon-gyu", "position": "LB", "overall": 74, "pace": 77, "shooting": 66, "passing": 72, "dribbling": 74, "defending": 74, "physical": 73, "awareness": 74, "catching": 74, "reflexes": 74, "diving": 74, "jumping": 74, "rarity": "Standard"},
  {"id": "real_854", "name": "Cho Gue-sung", "position": "RB", "overall": 76, "pace": 79, "shooting": 68, "passing": 74, "dribbling": 76, "defending": 76, "physical": 75, "awareness": 76, "catching": 76, "reflexes": 76, "diving": 76, "jumping": 76, "rarity": "Standard"},
  {"id": "real_855", "name": "Hwang Hee-chan", "position": "LB", "overall": 88, "pace": 91, "shooting": 80, "passing": 86, "dribbling": 88, "defending": 88, "physical": 87, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_856", "name": "Son Jun-ho", "position": "RB", "overall": 75, "pace": 78, "shooting": 67, "passing": 73, "dribbling": 75, "defending": 75, "physical": 74, "awareness": 75, "catching": 75, "reflexes": 75, "diving": 75, "jumping": 75, "rarity": "Standard"},
  {"id": "real_857", "name": "Dominik Szoboszlai", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_858", "name": "Sandro Tonali", "position": "CM", "overall": 88, "pace": 87, "shooting": 86, "passing": 91, "dribbling": 90, "defending": 87, "physical": 88, "awareness": 88, "catching": 88, "reflexes": 88, "diving": 88, "jumping": 88, "rarity": "Epic"},
  {"id": "real_859", "name": "Nicolò Fagioli", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_860", "name": "Lorenzo Pellegrini", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_861", "name": "Bryan Cristante", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_862", "name": "Matteo Pessina", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_863", "name": "Tommaso Pobega", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_864", "name": "Rocco Reitz", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_865", "name": "Angelo Stiller", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_866", "name": "Konrad Laimer", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_867", "name": "Marcel Sabitzer", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_868", "name": "Xaver Schlager", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_869", "name": "Florian Grillitsch", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_870", "name": "Christoph Baumgartner", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_871", "name": "Amine Gouiri", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_872", "name": "Khephren Thuram", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_873", "name": "Aurélien Tchouaméni", "position": "CM", "overall": 90, "pace": 89, "shooting": 88, "passing": 93, "dribbling": 92, "defending": 89, "physical": 90, "awareness": 90, "catching": 90, "reflexes": 90, "diving": 90, "jumping": 90, "rarity": "Epic"},
  {"id": "real_874", "name": "Moussa Diaby", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_875", "name": "Rayan Cherki", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_876", "name": "Malo Gusto", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_877", "name": "Azzedine Ounahi", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_878", "name": "Bilal El Khannouss", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_879", "name": "Younès Belhanda", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_880", "name": "Hakim Ziyech", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_881", "name": "Selim Amallah", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_882", "name": "Ismael Saibari", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_883", "name": "Oussama Idrissi", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_884", "name": "Abde Ezzalzouli", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_885", "name": "Takefusa Kubo", "position": "CM", "overall": 89, "pace": 88, "shooting": 87, "passing": 92, "dribbling": 91, "defending": 88, "physical": 89, "awareness": 89, "catching": 89, "reflexes": 89, "diving": 89, "jumping": 89, "rarity": "Epic"},
  {"id": "real_886", "name": "Ao Tanaka", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_887", "name": "Reo Hatate", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_888", "name": "Takumi Minamino", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_889", "name": "Hwang In-beom", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_890", "name": "Jung Woo-young", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_891", "name": "Lee Jae-sung", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_892", "name": "Hong Hyun-seok", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_893", "name": "Abdulrahman Ghareeb", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_894", "name": "Salem Al-Dawsari", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_895", "name": "Nasser Al-Dawsari", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_896", "name": "Abdulelah Al-Malki", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_897", "name": "Seko Fofana", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_898", "name": "Yacine Adli", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_899", "name": "Henrikh Mkhitaryan", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_900", "name": "Nicolo Zaniolo", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_901", "name": "Stephan El Shaarawy", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_902", "name": "Gaetano Castrovilli", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_903", "name": "Adrien Tameze", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_904", "name": "Ruslan Malinovskyi", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_905", "name": "Morten Hjulmand", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_906", "name": "Orkun Kökçü", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_907", "name": "Fred", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_908", "name": "Casemiro", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_909", "name": "Gerson", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_910", "name": "André Trindade", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_911", "name": "João Gomes", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_912", "name": "André Santos", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_913", "name": "Douglas Luiz", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_914", "name": "Arthur Melo", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_915", "name": "Renato Augusto", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_916", "name": "Oscar", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_917", "name": "Lucas Lima", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_918", "name": "Paulinho", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_919", "name": "Ramires", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_920", "name": "Jadson", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_921", "name": "Giuliano", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_922", "name": "Diego Ribas", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_923", "name": "Fernandinho", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_924", "name": "Elias", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_925", "name": "Willian Arão", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_926", "name": "Allan", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_927", "name": "Richard Ríos", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_928", "name": "Jhon Arias", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_929", "name": "Jorge Carrascal", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_930", "name": "Juan Fernando Quintero", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_931", "name": "Jefferson Lerma", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_932", "name": "Yangel Herrera", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_933", "name": "Eduard Atuesta", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_934", "name": "Wilmar Barrios", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_935", "name": "Johan Carbonero", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_936", "name": "Enzo Pérez", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_937", "name": "Guido Rodríguez", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_938", "name": "Giovani Lo Celso", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_939", "name": "Exequiel Palacios", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_940", "name": "Leandro Paredes", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_941", "name": "Rodrigo De Paul", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_942", "name": "Pablo Aimar", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_943", "name": "Javier Pastore", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_944", "name": "Éver Banega", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_945", "name": "Lucas Torreira", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_946", "name": "Manuel Ugarte", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_947", "name": "Facundo Pellistri", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_948", "name": "Nicolás de la Cruz", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_949", "name": "Giorgian De Arrascaeta", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_950", "name": "Matías Vecino", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_951", "name": "Rodrigo Bentancur", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_952", "name": "Federico Viñas", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_953", "name": "Diego Laxalt", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_954", "name": "Carlos Sánchez", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_955", "name": "Gaston Pereiro", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_956", "name": "Christian Oliva", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_957", "name": "Charles Aránguiz", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_958", "name": "Marcelino Núñez", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_959", "name": "Erick Pulgar", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_960", "name": "Diego Valdés", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_961", "name": "Jordhy Thompson", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_962", "name": "Claudio Baeza", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_963", "name": "Sergio Peña", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_964", "name": "Pedro Aquino", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_965", "name": "Yoshimar Yotún", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_966", "name": "Christian Cueva", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_967", "name": "Gianluca Lapadula", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_968", "name": "Piero Quispe", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_969", "name": "Pedro Vite", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_970", "name": "Kendry Páez", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_971", "name": "Alan Franco", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_972", "name": "Jeremy Sarmiento", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_973", "name": "Gonzalo Plata", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_974", "name": "Ángel Mena", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_975", "name": "Romario Ibarra", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_976", "name": "Jhegson Méndez", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_977", "name": "Carlos Gruezo", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_978", "name": "Darwin Machís", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_979", "name": "Jefferson Savarino", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_980", "name": "Yeferson Soteldo", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_981", "name": "Josef Martínez", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_982", "name": "Rómulo Otero", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_983", "name": "Tomás Rincón", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_984", "name": "Eduard Bello", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_985", "name": "Rafael Carioca", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_986", "name": "Luis Chávez", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_987", "name": "Edson Álvarez", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_988", "name": "Orbelín Pineda", "position": "CM", "overall": 82, "pace": 81, "shooting": 80, "passing": 85, "dribbling": 84, "defending": 81, "physical": 82, "awareness": 82, "catching": 82, "reflexes": 82, "diving": 82, "jumping": 82, "rarity": "Rare"},
  {"id": "real_989", "name": "Luis Romo", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_990", "name": "Erick Sánchez", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_991", "name": "Marcel Ruiz", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_992", "name": "Carlos Rodríguez", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_993", "name": "Uriel Antuna", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_994", "name": "Diego Lainez", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_995", "name": "Héctor Herrera", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"},
  {"id": "real_996", "name": "Jonathan dos Santos", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_997", "name": "Andrés Guardado", "position": "CM", "overall": 81, "pace": 80, "shooting": 79, "passing": 84, "dribbling": 83, "defending": 80, "physical": 81, "awareness": 81, "catching": 81, "reflexes": 81, "diving": 81, "jumping": 81, "rarity": "Rare"},
  {"id": "real_998", "name": "Efraín Álvarez", "position": "CM", "overall": 84, "pace": 83, "shooting": 82, "passing": 87, "dribbling": 86, "defending": 83, "physical": 84, "awareness": 84, "catching": 84, "reflexes": 84, "diving": 84, "jumping": 84, "rarity": "Rare"},
  {"id": "real_999", "name": "Alan Pulido", "position": "CM", "overall": 83, "pace": 82, "shooting": 81, "passing": 86, "dribbling": 85, "defending": 82, "physical": 83, "awareness": 83, "catching": 83, "reflexes": 83, "diving": 83, "jumping": 83, "rarity": "Rare"},
  {"id": "real_1000", "name": "Diego Luna", "position": "CM", "overall": 80, "pace": 79, "shooting": 78, "passing": 83, "dribbling": 82, "defending": 79, "physical": 80, "awareness": 80, "catching": 80, "reflexes": 80, "diving": 80, "jumping": 80, "rarity": "Rare"}
];

const REAL_PLAYER_MAP = Object.fromEntries(REAL_PLAYER_POOL.map((p) => [p.id, p]));
function getFootballCardById(id) { return REAL_PLAYER_MAP[id] || getLegacyCardById(id); }
const getCardById = getFootballCardById;

const FORMATIONS = {
  "4-3-3": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 16, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 84, y: 70 },
    { id: "CM1", label: "CM", x: 30, y: 52 },
    { id: "CM2", label: "CM", x: 70, y: 52 },
    { id: "CDM", label: "CDM", x: 50, y: 62 },
    { id: "LW", label: "LW", x: 20, y: 28 },
    { id: "ST", label: "ST", x: 50, y: 20 },
    { id: "RW", label: "RW", x: 80, y: 28 },
  ],
  "4-4-2": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "LM", label: "LM", x: 15, y: 48 },
    { id: "CM1", label: "CM", x: 38, y: 53 },
    { id: "CM2", label: "CM", x: 62, y: 53 },
    { id: "RM", label: "RM", x: 85, y: 48 },
    { id: "ST1", label: "ST", x: 40, y: 22 },
    { id: "ST2", label: "ST", x: 60, y: 22 },
  ],
  "4-2-3-1": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "CDM1", label: "CDM", x: 38, y: 57 },
    { id: "CDM2", label: "CDM", x: 62, y: 57 },
    { id: "LW", label: "LW", x: 20, y: 37 },
    { id: "CAM", label: "CAM", x: 50, y: 35 },
    { id: "RW", label: "RW", x: 80, y: 37 },
    { id: "ST", label: "ST", x: 50, y: 19 },
  ],
  "4-3-1-2": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "CM1", label: "CM", x: 28, y: 53 },
    { id: "CDM", label: "CDM", x: 50, y: 59 },
    { id: "CM2", label: "CM", x: 72, y: 53 },
    { id: "CAM", label: "CAM", x: 50, y: 36 },
    { id: "ST1", label: "ST", x: 40, y: 19 },
    { id: "ST2", label: "ST", x: 60, y: 19 },
  ],
  "4-1-4-1": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "CDM", label: "CDM", x: 50, y: 59 },
    { id: "LM", label: "LM", x: 15, y: 43 },
    { id: "CM1", label: "CM", x: 38, y: 46 },
    { id: "CM2", label: "CM", x: 62, y: 46 },
    { id: "RM", label: "RM", x: 85, y: 43 },
    { id: "ST", label: "ST", x: 50, y: 20 },
  ],
  "3-5-2": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "CB1", label: "CB", x: 27, y: 72 },
    { id: "CB2", label: "CB", x: 50, y: 75 },
    { id: "CB3", label: "CB", x: 73, y: 72 },
    { id: "LM", label: "LM", x: 10, y: 50 },
    { id: "CM1", label: "CM", x: 30, y: 53 },
    { id: "CDM", label: "CDM", x: 50, y: 58 },
    { id: "CM2", label: "CM", x: 70, y: 53 },
    { id: "RM", label: "RM", x: 90, y: 50 },
    { id: "ST1", label: "ST", x: 40, y: 22 },
    { id: "ST2", label: "ST", x: 60, y: 22 },
  ],
  "3-4-3": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "CB1", label: "CB", x: 27, y: 73 },
    { id: "CB2", label: "CB", x: 50, y: 75 },
    { id: "CB3", label: "CB", x: 73, y: 73 },
    { id: "LM", label: "LM", x: 15, y: 50 },
    { id: "CM1", label: "CM", x: 38, y: 53 },
    { id: "CM2", label: "CM", x: 62, y: 53 },
    { id: "RM", label: "RM", x: 85, y: 50 },
    { id: "LW", label: "LW", x: 20, y: 25 },
    { id: "ST", label: "ST", x: 50, y: 19 },
    { id: "RW", label: "RW", x: 80, y: 25 },
  ],
  "5-3-2": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LWB", label: "LWB", x: 8, y: 65 },
    { id: "CB1", label: "CB", x: 30, y: 73 },
    { id: "CB2", label: "CB", x: 50, y: 75 },
    { id: "CB3", label: "CB", x: 70, y: 73 },
    { id: "RWB", label: "RWB", x: 92, y: 65 },
    { id: "CM1", label: "CM", x: 30, y: 50 },
    { id: "CDM", label: "CDM", x: 50, y: 56 },
    { id: "CM2", label: "CM", x: 70, y: 50 },
    { id: "ST1", label: "ST", x: 40, y: 21 },
    { id: "ST2", label: "ST", x: 60, y: 21 },
  ],
  "5-2-3": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LWB", label: "LWB", x: 8, y: 65 },
    { id: "CB1", label: "CB", x: 30, y: 73 },
    { id: "CB2", label: "CB", x: 50, y: 75 },
    { id: "CB3", label: "CB", x: 70, y: 73 },
    { id: "RWB", label: "RWB", x: 92, y: 65 },
    { id: "CM1", label: "CM", x: 38, y: 53 },
    { id: "CM2", label: "CM", x: 62, y: 53 },
    { id: "LW", label: "LW", x: 20, y: 25 },
    { id: "ST", label: "ST", x: 50, y: 19 },
    { id: "RW", label: "RW", x: 80, y: 25 },
  ],
  "4-2-2-2": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "CDM1", label: "CDM", x: 38, y: 56 },
    { id: "CDM2", label: "CDM", x: 62, y: 56 },
    { id: "CAM1", label: "CAM", x: 30, y: 36 },
    { id: "CAM2", label: "CAM", x: 70, y: 36 },
    { id: "ST1", label: "ST", x: 40, y: 19 },
    { id: "ST2", label: "ST", x: 60, y: 19 },
  ],
  "4-3-2-1": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "CM1", label: "CM", x: 28, y: 53 },
    { id: "CDM", label: "CDM", x: 50, y: 59 },
    { id: "CM2", label: "CM", x: 72, y: 53 },
    { id: "CAM1", label: "CAM", x: 37, y: 33 },
    { id: "CAM2", label: "CAM", x: 63, y: 33 },
    { id: "ST", label: "ST", x: 50, y: 19 },
  ],
};

function getPlayerKey() {
  const saved = localStorage.getItem("ralouFootballPlayerId");
  if (saved) return saved;

  const newId =
    "football_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 9);

  localStorage.setItem("ralouFootballPlayerId", newId);
  return newId;
}

function getLocalKey(playerKey) {
  return `ralouFootballSave_${playerKey}`;
}

function readLocalSave(playerKey) {
  try {
    const raw = localStorage.getItem(getLocalKey(playerKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getSuspKey(playerKey) {
  return `ralouFootballSusp_${playerKey}`;
}

function readSusp(playerKey) {
  try {
    const raw = JSON.parse(localStorage.getItem(getSuspKey(playerKey)) || "{}");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function normalizeSquad(rawSquad) {
  if (!rawSquad) return {};

  if (typeof rawSquad === "object" && !Array.isArray(rawSquad)) {
    return rawSquad;
  }

  if (Array.isArray(rawSquad)) {
    const slots = FORMATIONS["4-3-3"];
    const result = {};
    rawSquad.forEach((cardId, index) => {
      if (slots[index]) result[slots[index].id] = cardId;
    });
    return result;
  }

  return {};
}

function normalizeHistory(raw) {
  return Array.isArray(raw) ? raw.slice(0, 20) : [];
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function getPositionGroup(position) {
  const groups = {
    GK: ["GK"],
    // Lini belakang sengaja dibuat fleksibel: CB bisa bergeser ke LB/RB,
    // fullback bisa masuk CB/LWB/RWB, tetapi GK tetap eksklusif.
    LB: ["LB", "LWB", "CB"],
    LWB: ["LB", "LWB", "LM", "CB"],
    RB: ["RB", "RWB", "CB"],
    RWB: ["RB", "RWB", "RM", "CB"],
    CB: ["CB", "LB", "RB", "LWB", "RWB"],
    CDM: ["CDM", "CM", "CAM"],
    CM: ["CM", "CDM", "CAM", "LM", "RM"],
    CAM: ["CAM", "CM", "CDM", "CF", "ST"],
    LM: ["LM", "LWB", "CM", "LW"],
    RM: ["RM", "RWB", "CM", "RW"],
    LW: ["LW", "LM", "RW", "CAM", "CF", "ST"],
    RW: ["RW", "RM", "LW", "CAM", "CF", "ST"],
    CF: ["CF", "CAM", "ST", "LW", "RW"],
    ST: ["ST", "CF", "CAM", "LW", "RW"],
  };

  return groups[position] || [position];
}

function isCompatiblePosition(card, slotPosition) {
  if (!card) return false;

  if (slotPosition === "GK") {
    return card.position === "GK";
  }

  if (card.position === "GK") return false;

  const cardPositions = getPositionGroup(card.position);
  const slotPositions = getPositionGroup(slotPosition);

  return (
    cardPositions.some((position) => slotPositions.includes(position)) ||
    card.position === slotPosition
  );
}

// ===== Aturan nama pemain unik di squad & nomor punggung =====
function normName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Cari pemain lain di squad yang namanya sama dengan `card`.
// exceptSlotId = slot yang sedang diganti (boleh diisi ulang oleh nama yang sama).
function findSameNameInSquad(squad, card, exceptSlotId = null) {
  const key = normName(card?.name);
  if (!key || !squad) return null;

  for (const [slotId, cardId] of Object.entries(squad)) {
    if (slotId === exceptSlotId) continue;
    const other = getFootballCardById(cardId);
    if (other && normName(other.name) === key) return { slotId, card: other };
  }
  return null;
}

function normalizeJersey(raw) {
  const out = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [cardId, n] of Object.entries(raw)) {
      const num = Math.round(Number(n));
      if (Number.isFinite(num) && num >= 1 && num <= 99) out[cardId] = num;
    }
  }
  return out;
}

// Hasilkan { [slotId]: nomorPunggung } yang dijamin unik di formasi aktif.
// Nomor custom didahulukan; pemain tanpa nomor custom dapat nomor urutan slot,
// dan kalau bentrok diberi nomor terkecil yang masih kosong.
function computeSlotNumbers(slots, squad, jersey = {}) {
  const result = {};
  const taken = new Set();

  (slots || []).forEach((slot) => {
    const cardId = squad[slot.id];
    const n = cardId ? jersey[cardId] : null;
    if (n && !taken.has(n)) {
      result[slot.id] = n;
      taken.add(n);
    }
  });

  (slots || []).forEach((slot, i) => {
    if (!squad[slot.id] || result[slot.id]) return;
    let n = i + 1;
    if (taken.has(n)) {
      n = 1;
      while (taken.has(n)) n++;
    }
    result[slot.id] = n;
    taken.add(n);
  });

  return result;
}

function getSquadPlayers(squad) {
  return Object.entries(squad)
    .map(([slotId, cardId]) => {
      const card = getFootballCardById(cardId);
      return card ? { slotId, card } : null;
    })
    .filter(Boolean);
}

function getTeamOverall(squad) {
  const players = getSquadPlayers(squad);
  if (players.length === 0) return 0;

  const total = players.reduce((sum, item) => sum + item.card.overall, 0);
  return Math.round(total / players.length);
}

function getSquadStrength(squad) {
  const players = getSquadPlayers(squad);
  if (players.length === 0) return 0;

  const total = players.reduce((sum, item) => {
    const c = item.card;
    const main =
      c.position === "GK"
        ? (c.awareness + c.catching + c.reflexes + c.diving + c.jumping + c.physical) / 6
        : (c.pace + c.shooting + c.passing + c.dribbling + c.defending + c.physical) / 6;

    return sum + main;
  }, 0);

  return Math.round(total / players.length);
}

export default function FootballGame({ backToGameHub }) {
  const [playerKey] = useState(getPlayerKey);
  const localInitial = useMemo(() => readLocalSave(playerKey), [playerKey]);

  const [coins, setCoins] = useState(
    typeof localInitial?.coins === "number" ? localInitial.coins : INITIAL_COINS
  );
  const [results, setResults] = useState([]);
  const [teamName, setTeamName] = useState(localInitial?.teamName || "RGame FC");
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [collection, setCollection] = useState(
    Array.isArray(localInitial?.collection) ? localInitial.collection : []
  );
  const [squad, setSquad] = useState(normalizeSquad(localInitial?.squad));
  const [selectedTab, setSelectedTab] = useState("gacha");
  const [loading, setLoading] = useState(true);
  const [formation, setFormation] = useState(
    localInitial?.formation && FORMATIONS[localInitial.formation]
      ? localInitial.formation
      : "4-3-3"
  );
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dailyClaimDate, setDailyClaimDate] = useState(
    localInitial?.dailyClaimDate || null
  );
  const [history, setHistory] = useState(
    normalizeHistory(localInitial?.history)
  );
  // nomor punggung custom: { [cardId]: 1..99 }
  const [jerseyNumbers, setJerseyNumbers] = useState(
    normalizeJersey(localInitial?.jerseyNumbers)
  );
  // pemain kena kartu merah: { [cardId]: true } -> tidak boleh main di Match berikutnya
  const [suspended, setSuspended] = useState(() => readSusp(playerKey));

  const squadCardIds = Object.values(squad);

  const activeSquadCardIds = useMemo(() => {
    const activeSlotIds = new Set(
      (FORMATIONS[formation] || []).map((slot) => slot.id)
    );

    return Object.entries(squad)
      .filter(([slotId]) => activeSlotIds.has(slotId))
      .map(([, cardId]) => cardId);
  }, [squad, formation]);

  const collectionCounts = useMemo(() => {
    const counts = {};
    for (const id of collection) {
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [collection]);

  function getSquadUsageCount(cardId) {
    return squadCardIds.filter((id) => id === cardId).length;
  }

  const activeSquad = useMemo(() => {
    const activeSlotIds = new Set(
      (FORMATIONS[formation] || []).map((slot) => slot.id)
    );

    return Object.fromEntries(
      Object.entries(squad).filter(([slotId]) => activeSlotIds.has(slotId))
    );
  }, [squad, formation]);

  const slotNumberMap = useMemo(
    () => computeSlotNumbers(FORMATIONS[formation], activeSquad, jerseyNumbers),
    [formation, activeSquad, jerseyNumbers]
  );

  const teamOverall = useMemo(() => getTeamOverall(activeSquad), [activeSquad]);
  const teamStrength = useMemo(() => getSquadStrength(activeSquad), [activeSquad]);

  const selectedSlotData = useMemo(() => {
    if (!selectedSlot) return null;
    return FORMATIONS[formation]?.find((slot) => slot.id === selectedSlot) || null;
  }, [selectedSlot, formation]);

  const selectableCards = useMemo(() => {
    if (!selectedSlotData) return [];

    const slotPosition = selectedSlotData.label;
    const cards = [];

    for (const cardId of Object.keys(collectionCounts)) {
      const card = getFootballCardById(cardId);
      if (!card) continue;

      if (!isCompatiblePosition(card, slotPosition)) continue;

      // pemain dengan nama yang sudah ada di squad tidak bisa dipilih lagi
      if (findSameNameInSquad(squad, card, selectedSlot)) continue;

      const owned = collectionCounts[cardId] || 0;
      const used = getSquadUsageCount(cardId);

      if (used >= owned) continue;
      cards.push(card);
    }

    return cards.sort((a, b) => b.overall - a.overall);
  }, [selectedSlotData, selectedSlot, collectionCounts, squadCardIds, squad]);

  useEffect(() => {
    const local = readLocalSave(playerKey);
    if (local) {
      setCoins(typeof local.coins === "number" ? local.coins : INITIAL_COINS);
      setCollection(Array.isArray(local.collection) ? local.collection : []);
      setSquad(normalizeSquad(local.squad));
      setFormation(
        local.formation && FORMATIONS[local.formation]
          ? local.formation
          : "4-3-3"
      );
      setDailyClaimDate(local.dailyClaimDate || null);
      setHistory(normalizeHistory(local.history));
      setJerseyNumbers(normalizeJersey(local.jerseyNumbers));
      setTeamName(local.teamName || "RGame FC");
    }

    const playerRef = ref(db, `footballPlayers/${playerKey}`);

    const unsubscribe = onValue(
      playerRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          setCoins(typeof data.coins === "number" ? data.coins : INITIAL_COINS);
          setCollection(Array.isArray(data.collection) ? data.collection : []);
          setSquad(normalizeSquad(data.squad));
          setFormation(
            data.formation && FORMATIONS[data.formation]
              ? data.formation
              : "4-3-3"
          );
          setDailyClaimDate(data.dailyClaimDate || null);
          setHistory(normalizeHistory(data.history));
          setJerseyNumbers(normalizeJersey(data.jerseyNumbers));
          setTeamName(data.teamName || "RGame FC");
        }

        setLoading(false);
      },
      (error) => {
        console.error("Football Firebase error:", error);
        setMessage(
          "Mode offline aktif. Data tetap disimpan di browser. Firebase Rules bisa dibetulkan nanti."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [playerKey]);

  useEffect(() => {
    const unsub = onValue(
      ref(db, `footballSuspensions/${playerKey}`),
      (snapshot) => {
        const v = snapshot.val();
        if (v && typeof v === "object") setSuspended(v);
      },
      () => {}
    );
    return () => unsub();
  }, [playerKey]);

  function saveSusp(next) {
    try {
      localStorage.setItem(getSuspKey(playerKey), JSON.stringify(next));
    } catch (error) {
      console.error("Football suspension local save error:", error);
    }
    set(ref(db, `footballSuspensions/${playerKey}`), next).catch((error) => {
      console.error("Football suspension save error:", error);
    });
  }

  function saveData(
    nextCoins,
    nextCollection,
    nextSquad,
    nextFormation = formation,
    nextDailyClaimDate = dailyClaimDate,
    nextHistory = history,
    nextTeamName = teamName,
    nextJersey = jerseyNumbers
  ) {
    const payload = {
      coins: nextCoins,
      collection: nextCollection,
      squad: nextSquad,
      formation: nextFormation,
      dailyClaimDate: nextDailyClaimDate,
      history: nextHistory.slice(0, 20),
      jerseyNumbers: nextJersey,
      teamName: String(nextTeamName || "RGame FC").trim().slice(0, 24) || "RGame FC",
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(getLocalKey(playerKey), JSON.stringify(payload));
    } catch (error) {
      console.error("Football local save error:", error);
    }

    set(ref(db, `footballPlayers/${playerKey}`), payload).catch((error) => {
      console.error("Football Firebase save error:", error);
    });
  }

  function saveTeamName(nextName) {
    const clean = String(nextName || "").trim().replace(/\s+/g, " ").slice(0, 24);
    const finalName = clean || "RGame FC";
    setTeamName(finalName);
    saveData(coins, collection, squad, formation, dailyClaimDate, history, finalName);
    setMessage(`Nama tim disimpan sebagai ${finalName}.`);
  }

  function claimDailyCoins() {
    const today = getTodayKey();

    if (dailyClaimDate === today) {
      setMessage("Bonus harian sudah diambil hari ini.");
      return;
    }

    const isFirstDay = !dailyClaimDate;
    const reward = isFirstDay ? FIRST_DAY_COINS : DAILY_COINS;
    const nextCoins = coins + reward;

    setCoins(nextCoins);
    setDailyClaimDate(today);
    saveData(nextCoins, collection, squad, formation, today, history);

    setMessage(
      isFirstDay
        ? "+400 🪙 First Day Bonus berhasil diambil!"
        : "+200 🪙 bonus harian berhasil diambil!"
    );
  }

  function doSingleGacha() {
    if (coins < SINGLE_COST) {
      setMessage("Coin lu nggak cukup.");
      return;
    }

    const card = REAL_PLAYER_POOL[Math.floor(Math.random() * REAL_PLAYER_POOL.length)] || drawCard();

    if (!card) {
      setMessage("Belum ada kartu untuk rarity tersebut.");
      return;
    }

    const nextCoins = coins - SINGLE_COST;
    const nextCollection = [...collection, card.id];

    setCoins(nextCoins);
    setCollection(nextCollection);
    setResults([card]);
    setRevealed(false);

    saveData(nextCoins, nextCollection, squad);

    setMessage(`${card.name} berhasil masuk Collection!`);
  }

  function doTenGacha() {
    if (coins < TEN_COST) {
      setMessage("Coin lu nggak cukup.");
      return;
    }

    const cards = Array.from({ length: 10 }, () => REAL_PLAYER_POOL[Math.floor(Math.random() * REAL_PLAYER_POOL.length)] || drawCard()).filter(Boolean);
    const cardIds = cards.map((card) => card.id);
    const nextCoins = coins - TEN_COST;
    const nextCollection = [...collection, ...cardIds];

    setCoins(nextCoins);
    setCollection(nextCollection);
    setResults(cards);
    setRevealed(false);

    saveData(nextCoins, nextCollection, squad);

    setMessage(`${cards.length} kartu berhasil masuk Collection!`);
  }

  function revealCards() {
    setRevealed(true);
  }

  function putPlayerIntoSlot(cardId) {
    if (!selectedSlot) return;

    const card = getFootballCardById(cardId);
    if (!card) return;

    const slot = FORMATIONS[formation]?.find((item) => item.id === selectedSlot);
    if (!slot) return;

    if (!isCompatiblePosition(card, slot.label)) {
      setMessage(`${card.name} tidak cocok untuk posisi ${slot.label}.`);
      return;
    }

    const sameName = findSameNameInSquad(squad, card, selectedSlot);
    if (sameName) {
      setMessage(
        `${card.name} sudah ada di squad, jadi pemain dengan nama yang sama tidak bisa dimasukkan lagi.`
      );
      return;
    }

    const oldCardId = squad[selectedSlot];

    if (oldCardId === cardId) {
      setMessage(`${card.name} sudah berada di posisi ini.`);
      setSelectedSlot(null);
      return;
    }

    const usedElsewhere = Object.entries(squad).filter(
      ([slotId, id]) => id === cardId && slotId !== selectedSlot
    ).length;

    const owned = collectionCounts[cardId] || 0;

    if (usedElsewhere >= owned) {
      setMessage("Jumlah kartu yang lu punya tidak cukup untuk memakai copy ini lagi.");
      return;
    }

    const nextSquad = {
      ...squad,
      [selectedSlot]: cardId,
    };

    setSquad(nextSquad);
    saveData(coins, collection, nextSquad);

    setSelectedSlot(null);

    if (oldCardId) {
      const oldCard = getFootballCardById(oldCardId);
      setMessage(
        `${card.name} menggantikan ${oldCard?.name || "pemain lama"} di ${slot.label}.`
      );
    } else {
      setMessage(`${card.name} masuk ke posisi ${slot.label}!`);
    }
  }

  function removeFromSlot(slotId) {
    if (!slotId || !squad[slotId]) return;

    const removed = getFootballCardById(squad[slotId]);
    const nextSquad = { ...squad };
    delete nextSquad[slotId];

    setSquad(nextSquad);
    saveData(coins, collection, nextSquad);
    setSelectedSlot(null);

    setMessage(
      `${removed?.name || "Pemain"} dikeluarkan dari squad.`
    );
  }

  function changeFormation(nextFormation) {
    if (!FORMATIONS[nextFormation]) return;

    const nextSlots = FORMATIONS[nextFormation];
    const currentPlayers = Object.values(squad)
      .map((cardId) => getFootballCardById(cardId))
      .filter(Boolean);

    // Jangan buang 11 pemain ketika formasi berubah.
    // Kita susun ulang pemain ke slot formasi baru: utamakan posisi yang cocok,
    // lalu gunakan slot tersisa sebagai fallback supaya jumlah pemain tetap 11.
    const nextSquad = {};
    const usedCardIndexes = new Set();

    // 1. GK selalu dicari ke slot GK.
    const gkSlot = nextSlots.find((slot) => slot.label === "GK");
    const gkIndex = currentPlayers.findIndex((card) => card.position === "GK");
    if (gkSlot && gkIndex >= 0) {
      nextSquad[gkSlot.id] = currentPlayers[gkIndex].id;
      usedCardIndexes.add(gkIndex);
    }

    // 2. Isi slot lain dengan pemain yang posisi aslinya paling cocok.
    for (const slot of nextSlots) {
      if (nextSquad[slot.id]) continue;

      let bestIndex = -1;

      for (let i = 0; i < currentPlayers.length; i++) {
        if (usedCardIndexes.has(i)) continue;
        const card = currentPlayers[i];

        if (isCompatiblePosition(card, slot.label)) {
          bestIndex = i;
          break;
        }
      }

      if (bestIndex >= 0) {
        nextSquad[slot.id] = currentPlayers[bestIndex].id;
        usedCardIndexes.add(bestIndex);
      }
    }

    // 3. Kalau formasi membutuhkan bentuk yang berbeda (mis. 5-3-2),
    // pemain yang tersisa tetap dipasang ke slot kosong daripada menghilang.
    // Ini memang bisa membuat beberapa pemain berada di luar posisi aslinya,
    // tetapi user tetap memiliki 11 pemain dan bisa melakukan pergantian saat halftime.
    for (let i = 0; i < currentPlayers.length; i++) {
      if (usedCardIndexes.has(i)) continue;

      const emptySlot = nextSlots.find((slot) => !nextSquad[slot.id]);
      if (!emptySlot) break;

      nextSquad[emptySlot.id] = currentPlayers[i].id;
      usedCardIndexes.add(i);
    }

    setFormation(nextFormation);
    setSquad(nextSquad);
    setSelectedSlot(null);
    saveData(coins, collection, nextSquad, nextFormation);

    const assigned = Object.keys(nextSquad).length;
    setMessage(
      assigned === MAX_SQUAD
        ? `Formasi diganti ke ${nextFormation}. 11 pemain tetap dipertahankan.`
        : `Formasi diganti ke ${nextFormation}. ${assigned}/${MAX_SQUAD} pemain terpasang.`
    );
  }

  function changeJerseyNumber(slotId, raw) {
    const cardId = squad[slotId];
    const card = cardId ? getFootballCardById(cardId) : null;
    if (!card) return false;

    const n = Math.round(Number(raw));
    if (!Number.isFinite(n) || n < 1 || n > 99) {
      setMessage("No punggung harus berupa angka 1 sampai 99.");
      return false;
    }

    const current = slotNumberMap[slotId];
    if (n === current) {
      setMessage(`${card.name} sudah memakai nomor ${n}.`);
      return false;
    }

    const next = { ...jerseyNumbers, [cardId]: n };

    // Kalau nomor itu dipakai pemain lain di squad, nomornya ditukar.
    const otherSlot = Object.keys(slotNumberMap).find(
      (sid) => sid !== slotId && slotNumberMap[sid] === n
    );
    const otherCard = otherSlot ? getFootballCardById(squad[otherSlot]) : null;
    if (otherSlot && otherCard) {
      next[squad[otherSlot]] = current;
    }

    setJerseyNumbers(next);
    saveData(coins, collection, squad, formation, dailyClaimDate, history, teamName, next);

    setMessage(
      otherCard
        ? `${card.name} sekarang nomor ${n}. Nomor ${current} diberikan ke ${otherCard.name} (ditukar).`
        : `${card.name} sekarang memakai nomor punggung ${n}.`
    );
    return true;
  }

  function clearSquad() {
    setSquad({});
    setSelectedSlot(null);
    saveData(coins, collection, {}, formation);
    setMessage("Semua pemain dikeluarkan dari squad.");
  }

  function addFromCollection(cardId) {
    const card = getFootballCardById(cardId);
    if (!card) return;

    if (findSameNameInSquad(squad, card)) {
      setMessage(
        `${card.name} sudah ada di squad, jadi pemain dengan nama yang sama tidak bisa dimasukkan lagi.`
      );
      return;
    }

    const availableSlot = FORMATIONS[formation].find(
      (slot) =>
        !squad[slot.id] &&
        isCompatiblePosition(card, slot.label)
    );

    if (!availableSlot) {
      setSelectedTab("squad");
      setMessage(
        `Tidak ada slot kosong yang cocok untuk ${card.name} di formasi ${formation}.`
      );
      return;
    }

    setSelectedTab("squad");
    setSelectedSlot(availableSlot.id);
    setMessage(
      `Pilih ${card.name} untuk dipasang di ${availableSlot.label}.`
    );
  }

  function addCoins(n) {
    const next = coins + n;
    setCoins(next);
    saveData(next, collection, squad, formation, dailyClaimDate, history);
  }

  function recordMatch(r) {
    const { reds = [], ...res } = r;
    // pemain yang sudah absen di match ini selesai skorsingnya; yang baru kena merah kena skorsing match berikutnya
    const nextSusp = {};
    reds.forEach((id) => { nextSusp[id] = true; });
    setSuspended(nextSusp);
    saveSusp(nextSusp);
    const nextCoins = coins + r.reward;
    const rec = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toLocaleString("id-ID"),
      ...res,
    };
    const nextHistory = [rec, ...history].slice(0, 20);
    setCoins(nextCoins);
    setHistory(nextHistory);
    saveData(nextCoins, collection, squad, formation, dailyClaimDate, nextHistory);
    setMessage(
      (r.result === "WIN" ? `MENANG! +${r.reward} 🪙`
        : r.result === "DRAW" ? `SERI! +${r.reward} 🪙`
        : `KALAH. Tetap dapat +${r.reward} 🪙`) +
      (reds.length ? ` 🟥 ${reds.length} pemain kena skorsing di match berikutnya.` : "")
    );
  }

  function substituteSlot(slotId, cardId) {
    const slot = FORMATIONS[formation]?.find((i) => i.id === slotId);
    const card = getFootballCardById(cardId);
    if (!slot || !card) return false;
    if (!isCompatiblePosition(card, slot.label)) {
      setMessage(`${card.name} tidak cocok untuk posisi ${slot.label}.`);
      return false;
    }
    if (findSameNameInSquad(squad, card, slotId)) {
      setMessage(`${card.name} sudah ada di squad, pemain dengan nama sama tidak bisa dimasukkan lagi.`);
      return false;
    }
    const used = Object.entries(squad).filter(([sid, id]) => sid !== slotId && id === cardId).length;
    if (used >= (collectionCounts[cardId] || 0)) {
      setMessage("Jumlah kartu yang lu punya tidak cukup untuk memakai copy ini lagi.");
      return false;
    }
    const nextSquad = { ...squad, [slotId]: cardId };
    setSquad(nextSquad);
    saveData(coins, collection, nextSquad, formation, dailyClaimDate, history);
    setMessage(`${card.name} masuk menggantikan pemain di ${slot.label}.`);
    return true;
  }

  function playMatch() {
    if (activeSquadCardIds.length !== MAX_SQUAD) {
      setSelectedTab("squad");
      setMessage(`Isi 11 pemain di formasi ${formation} dulu sebelum pertandingan.`);
      return;
    }
    if (!activeSquad.GK) {
      setSelectedTab("squad");
      setMessage("Squad wajib punya goalkeeper.");
      return;
    }
    setSelectedTab("match");
  }

    const matchPlayerNames = useMemo(() => {
    return (FORMATIONS[formation] || []).map((slot) => {
      const cardId = activeSquad[slot.id];
      const card = cardId ? getFootballCardById(cardId) : null;

      return {
        id: slot.id,
        position: slot.label,
        name: card?.name || "Belum diisi",
        overall: card?.overall || "-",
      };
    });
  }, [activeSquad, formation]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          color: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 800,
        }}
      >
        Memuat Football...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: CREAM,
        padding: 24,
        boxSizing: "border-box",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: GOLD,
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 3,
              }}
            >
              RALOU GAME HUB
            </div>
            <h1 style={{ margin: "5px 0 0", fontSize: 32 }}>
              Football
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: PANEL,
                border: `1px solid ${GOLD}`,
                borderRadius: 12,
                padding: "10px 16px",
                fontWeight: 900,
              }}
            >
              🪙 {coins}
            </div>

            <button
              onClick={claimDailyCoins}
              style={buttonStyle()}
              disabled={dailyClaimDate === getTodayKey()}
            >
              {dailyClaimDate === getTodayKey()
                ? "✓ Claimed Today"
                : dailyClaimDate
                ? "🎁 +200 Daily"
                : "🎁 +400 First Day"}
            </button>

            <button onClick={backToGameHub} style={buttonStyle()}>
              ← Game Hub
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <TabButton
            active={selectedTab === "gacha"}
            onClick={() => setSelectedTab("gacha")}
          >
            🎴 Gacha
          </TabButton>

          <TabButton
            active={selectedTab === "collection"}
            onClick={() => setSelectedTab("collection")}
          >
            📚 Collection ({collection.length})
          </TabButton>

          <TabButton
            active={selectedTab === "squad"}
            onClick={() => setSelectedTab("squad")}
          >
            ⚽ My Squad ({activeSquadCardIds.length}/11)
          </TabButton>

          <TabButton
            active={selectedTab === "match"}
            onClick={() => setSelectedTab("match")}
          >
            🏟️ Match
          </TabButton>

          <TabButton
            active={selectedTab === "history"}
            onClick={() => setSelectedTab("history")}
          >
            📜 History ({history.length})
          </TabButton>

          <TabButton
            active={selectedTab === "league"}
            onClick={() => setSelectedTab("league")}
          >
            🏆 Liga
          </TabButton>

          <TabButton
            active={selectedTab === "pvp"}
            onClick={() => setSelectedTab("pvp")}
          >
            ⚔️ PvP
          </TabButton>
        </div>

        {message && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 15px",
              background: PANEL,
              border: "1px solid rgba(201,162,39,0.35)",
              borderRadius: 12,
              color: CREAM,
              fontWeight: 700,
            }}
          >
            {message}
          </div>
        )}

        {selectedTab === "gacha" && (
          <GachaPanel
            results={results}
            revealed={revealed}
            revealCards={revealCards}
            doSingleGacha={doSingleGacha}
            doTenGacha={doTenGacha}
          />
        )}

        {selectedTab === "collection" && (
          <CollectionPanel
            collection={collection}
            collectionCounts={collectionCounts}
            onAddToSquad={addFromCollection}
          />
        )}

        {selectedTab === "squad" && (
          <>
            <TeamNamePanel teamName={teamName} onSave={saveTeamName} />
            <SquadBuilder
            formation={formation}
            setFormation={changeFormation}
            squad={squad}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
            removeFromSlot={removeFromSlot}
            clearSquad={clearSquad}
            selectableCards={selectableCards}
            putPlayerIntoSlot={putPlayerIntoSlot}
            slotNumbers={slotNumberMap}
            onChangeNumber={changeJerseyNumber}
            teamOverall={teamOverall}
            teamStrength={teamStrength}
            playMatch={playMatch}
          />
          </>
        )}

        {selectedTab === "match" && (
          <QuickMatchPanel
            teamOverall={teamOverall}
            slots={FORMATIONS[formation]}
            ready={activeSquadCardIds.length === 11 && !!activeSquad.GK}
            onRecord={recordMatch}
            formations={Object.keys(FORMATIONS)}
            formation={formation}
            onFormation={changeFormation}
            squad={activeSquad}
            collection={collection}
            counts={collectionCounts}
            getCard={getCardById}
            canPlay={isCompatiblePosition}
            onSub={substituteSlot}
            teamName={teamName}
            suspended={suspended}
            slotNumbers={slotNumberMap}
          />
        )}

        {selectedTab === "league" && (
          <LeaguePanel
            teamOverall={teamOverall}
            slots={FORMATIONS[formation]}
            ready={activeSquadCardIds.length === 11 && !!activeSquad.GK}
            onReward={addCoins}
            teamName={teamName}
            formations={Object.keys(FORMATIONS)}
            formation={formation}
            onFormation={changeFormation}
            squad={activeSquad}
            collection={collection}
            counts={collectionCounts}
            getCard={getCardById}
            canPlay={isCompatiblePosition}
            onSub={substituteSlot}
            suspended={suspended}
          />
        )}

        {selectedTab === "pvp" && (
          <PvPPanel myOvr={teamOverall} slots={FORMATIONS[formation]} teamName={teamName} />
        )}

        {selectedTab === "history" && (
          <HistoryPanel history={history} teamName={teamName} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "11px 17px",
        borderRadius: 11,
        border: active
          ? `1px solid ${GOLD}`
          : "1px solid rgba(245,239,224,0.12)",
        background: active
          ? "rgba(201,162,39,0.15)"
          : PANEL,
        color: active ? GOLD : CREAM,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function GachaPanel({
  results,
  revealed,
  revealCards,
  doSingleGacha,
  doTenGacha,
}) {
  return (
    <div
      style={{
        background: PANEL,
        borderRadius: 20,
        border: "1px solid rgba(201,162,39,0.3)",
        padding: 24,
      }}
    >
      <h2 style={{ marginTop: 0, color: GOLD }}>Player Gacha</h2>

      <p style={{ opacity: 0.75 }}>
        Kumpulkan pemain, susun squad, lalu bawa mereka ke pertandingan otomatis.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 12,
          marginBottom: 25,
        }}
      >
        <button onClick={doSingleGacha} style={buttonStyle()}>
          🎴 1x Gacha — 20 🪙
        </button>

        <button
          onClick={doTenGacha}
          style={{
            ...buttonStyle(),
            background: "rgba(201,162,39,0.16)",
          }}
        >
          🎴 10x Gacha — 200 🪙
        </button>
      </div>

      <div
        style={{
          background: PANEL_SOFT,
          borderRadius: 14,
          padding: 14,
          marginBottom: 20,
          fontSize: 13,
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: GOLD }}>Database:</strong>{" "}
        1.000 pemain nyata · Rating adalah rating game RGameHub
      </div>

      {results.length > 0 && (
        <>
          <button
            onClick={revealCards}
            style={{ ...buttonStyle(), marginBottom: 20 }}
          >
            {revealed ? "Cards Revealed" : "Reveal Cards"}
          </button>

          <div
            style={{
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {results.map((card, index) => (
              <PlayerCard
                key={`${card.id}-${index}`}
                card={card}
                revealed={revealed}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CollectionPanel({
  collection,
  collectionCounts,
  onAddToSquad,
}) {
  const uniqueCards = Object.keys(collectionCounts);

  if (uniqueCards.length === 0) {
    return (
      <div style={emptyStyle()}>
        Belum ada pemain.
        <br />
        Buka Gacha dulu.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 18, opacity: 0.75 }}>
        Total kartu: <strong>{collection.length}</strong>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 18,
        }}
      >
        {uniqueCards.map((cardId) => {
          const card = getFootballCardById(cardId);
          if (!card) return null;

          return (
            <CollectionCard
              key={cardId}
              card={card}
              count={collectionCounts[cardId]}
              onAdd={() => onAddToSquad(cardId)}
            />
          );
        })}
      </div>
    </div>
  );
} 

function CollectionCard({ card, count, onAdd }) {
  return (
    <div
      style={{
        background: PANEL,
        borderRadius: 18,
        padding: 12,
        border: "1px solid rgba(245,239,224,0.1)",
      }}
    >
      <PlayerCard card={card} />

      <button
        onClick={onAdd}
        style={{
          width: "100%",
          marginTop: 12,
          padding: 11,
          borderRadius: 10,
          border: `1px solid ${GOLD}`,
          background: "rgba(201,162,39,0.12)",
          color: CREAM,
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        + Masukkan ke Squad
      </button>

      <div
        style={{
          textAlign: "center",
          marginTop: 8,
          fontSize: 12,
          opacity: 0.7,
        }}
      >
        Owned ×{count}
      </div>
    </div>
  );
}


function TeamNamePanel({ teamName, onSave }) {
  const [value, setValue] = useState(teamName || "RGame FC");
  useEffect(() => setValue(teamName || "RGame FC"), [teamName]);
  return (
    <div style={{ background: PANEL, borderRadius: 18, padding: 18, marginBottom: 18, border: "1px solid rgba(201,162,39,0.3)" }}>
      <div style={{ color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>CLUB IDENTITY</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>Nama Tim</div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <input value={value} maxLength={24} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onSave(value); }} placeholder="Contoh: GARUDA UNITED" style={{ flex: "1 1 260px", padding: 12, borderRadius: 10, background: PANEL_SOFT, color: CREAM, border: `1px solid ${GOLD}`, fontWeight: 900, boxSizing: "border-box" }} />
        <button style={buttonStyle()} onClick={() => onSave(value)}>💾 Simpan Nama Tim</button>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, opacity: .6 }}>Maksimal 24 karakter. Nama ini dipakai di Match, Liga, dan PvP.</div>
    </div>
  );
}

function SquadBuilder({
  formation,
  setFormation,
  squad,
  selectedSlot,
  setSelectedSlot,
  removeFromSlot,
  clearSquad,
  selectableCards,
  putPlayerIntoSlot,
  slotNumbers = {},
  onChangeNumber,
  teamOverall,
  teamStrength,
  playMatch,
}) {
  const slots = FORMATIONS[formation] || FORMATIONS["4-3-3"];

  return (
    <div>
      <div
        style={{
          background: PANEL,
          borderRadius: 18,
          padding: 18,
          marginBottom: 18,
          border: "1px solid rgba(201,162,39,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 15,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: GOLD,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            MY SQUAD
          </div>

          <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>
            {slots.filter((slot) => squad[slot.id]).length}/11
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <StatBox label="OVR" value={teamOverall || "-"} />
          <StatBox label="POWER" value={teamStrength || "-"} />

          <span style={{ fontWeight: 800, opacity: 0.75 }}>
            Formation
          </span>

          <select
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            style={{
              background: PANEL_SOFT,
              color: CREAM,
              border: `1px solid ${GOLD}`,
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 900,
            }}
          >
            {Object.keys(FORMATIONS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            onClick={playMatch}
            style={{
              ...buttonStyle(),
              background: "rgba(201,162,39,0.2)",
            }}
          >
            🏟️ Play Match
          </button>

          <button
            onClick={clearSquad}
            style={{
              ...buttonStyle(),
              borderColor: "rgba(255,100,100,0.4)",
            }}
          >
            Clear Squad
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            position: "relative",
            width: "min(900px, 100%)",
            aspectRatio: "16 / 10",
            borderRadius: 25,
            overflow: "hidden",
            border: "3px solid rgba(245,239,224,0.25)",
            background:
              "linear-gradient(90deg, #17351f, #20552e, #17351f)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 55px, transparent 55px, transparent 110px)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              borderTop: "2px solid rgba(255,255,255,0.45)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 105,
              height: 105,
              border: "2px solid rgba(255,255,255,0.45)",
              borderRadius: "50%",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 7,
              height: 7,
              background: "rgba(255,255,255,0.7)",
              borderRadius: "50%",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "35%",
              height: "18%",
              left: "32.5%",
              top: 0,
              border: "2px solid rgba(255,255,255,0.4)",
              borderTop: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "35%",
              height: "18%",
              left: "32.5%",
              bottom: 0,
              border: "2px solid rgba(255,255,255,0.4)",
              borderBottom: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "18%",
              height: 5,
              left: "41%",
              top: 0,
              background: "rgba(255,255,255,0.65)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "18%",
              height: 5,
              left: "41%",
              bottom: 0,
              background: "rgba(255,255,255,0.65)",
            }}
          />

          {slots.map((slot) => {
            const cardId = squad[slot.id];
            const card = cardId ? getFootballCardById(cardId) : null;
            const active = selectedSlot === slot.id;

            return (
              <div
                key={slot.id}
                style={{
                  position: "absolute",
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: active ? 10 : 5,
                }}
              >
                <PitchPlayer
                  card={card}
                  label={slot.label}
                  number={slotNumbers[slot.id]}
                  active={active}
                  onClick={() => setSelectedSlot(slot.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {selectedSlot && (
        <div
          style={{
            marginTop: 18,
            background: PANEL,
            borderRadius: 18,
            padding: 20,
            border: "1px solid rgba(201,162,39,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: GOLD,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 2,
                }}
              >
                SELECT PLAYER
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  marginTop: 4,
                }}
              >
                Posisi:{" "}
                {FORMATIONS[formation]?.find(
                  (slot) => slot.id === selectedSlot
                )?.label || selectedSlot}
              </div>
            </div>

            <button
              onClick={() => setSelectedSlot(null)}
              style={buttonStyle()}
            >
              Tutup
            </button>
          </div>

          {squad[selectedSlot] && onChangeNumber && (
            <JerseyEditor
              slotId={selectedSlot}
              current={slotNumbers[selectedSlot]}
              playerName={getFootballCardById(squad[selectedSlot])?.name || "Pemain"}
              onSave={onChangeNumber}
            />
          )}

          {squad[selectedSlot] && (
            <button
              onClick={() => removeFromSlot(selectedSlot)}
              style={{
                width: "100%",
                marginBottom: 16,
                padding: 11,
                borderRadius: 10,
                border: "1px solid rgba(255,100,100,0.4)",
                background: "rgba(120,30,30,0.18)",
                color: CREAM,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🗑️ Keluarkan Pemain
            </button>
          )}

          {selectableCards.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 30,
                opacity: 0.7,
              }}
            >
              Belum ada kartu yang cocok untuk posisi ini.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(230px, 1fr))",
                gap: 15,
              }}
            >
              {selectableCards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: PANEL_SOFT,
                    borderRadius: 16,
                    padding: 10,
                    border: "1px solid rgba(245,239,224,0.1)",
                  }}
                >
                  <PlayerCard card={card} />

                  <button
                    onClick={() => putPlayerIntoSlot(card.id)}
                    style={{
                      width: "100%",
                      marginTop: 10,
                      padding: 11,
                      borderRadius: 10,
                      border: `1px solid ${GOLD}`,
                      background: "rgba(201,162,39,0.13)",
                      color: CREAM,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Pasang di{" "}
                    {FORMATIONS[formation]?.find(
                      (slot) => slot.id === selectedSlot
                    )?.label || selectedSlot}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ history, teamName }) {
  if (history.length === 0) {
    return (
      <div style={emptyStyle()}>
        Belum ada riwayat pertandingan.
        <br />
        Mainkan match pertama lu.
      </div>
    );
  }

  return (
    <div
      style={{
        background: PANEL,
        borderRadius: 20,
        padding: 22,
        border: "1px solid rgba(201,162,39,0.3)",
      }}
    >
      <h2 style={{ color: GOLD, marginTop: 0 }}>Match History</h2>

      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        {history.map((item) => (
          <div
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr auto",
              gap: 12,
              alignItems: "center",
              background: PANEL_SOFT,
              borderRadius: 12,
              padding: 13,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color:
                  item.result === "WIN"
                    ? "#69d27c"
                    : item.result === "LOSS"
                    ? "#ff7777"
                    : GOLD,
              }}
            >
              {item.result}
            </div>

            <div>
              <div style={{ fontWeight: 900 }}>
                {teamName || "RGame FC"} {item.userGoals} - {item.oppGoals} {item.opponent}
              </div>
              <div style={{ fontSize: 12, opacity: 0.55, marginTop: 3 }}>
                {item.date} · OVR {item.userOverall} vs {item.opponentOverall}
              </div>
            </div>

            <div style={{ fontWeight: 900, color: GOLD }}>
              +{item.reward} 🪙
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div
      style={{
        minWidth: 70,
        textAlign: "center",
        background: PANEL_SOFT,
        borderRadius: 10,
        padding: "7px 9px",
        border: "1px solid rgba(201,162,39,0.2)",
      }}
    >
      <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 900 }}>
        {label}
      </div>
      <div style={{ color: GOLD, fontSize: 18, fontWeight: 900 }}>
        {value}
      </div>
    </div>
  );
}

function PitchPlayer({ card, label, number, active, onClick }) {
  if (!card) {
    return (
      <button
        onClick={onClick}
        style={{
          width: 78,
          height: 78,
          borderRadius: "50%",
          border: active
            ? `3px solid ${GOLD}`
            : "2px dashed rgba(245,239,224,0.55)",
          background: "rgba(20,40,25,0.85)",
          color: CREAM,
          cursor: "pointer",
          boxShadow: active
            ? "0 0 25px rgba(201,162,39,0.65)"
            : "0 5px 15px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 25, fontWeight: 900 }}>+</div>
        <div style={{ fontSize: 10, fontWeight: 900 }}>{label}</div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        width: 112,
        minHeight: 110,
        borderRadius: 14,
        border: active
          ? `3px solid ${GOLD}`
          : "2px solid rgba(245,239,224,0.35)",
        background: "linear-gradient(145deg, #2c2618, #12110e)",
        color: CREAM,
        cursor: "pointer",
        padding: 7,
        boxShadow: active
          ? "0 0 28px rgba(201,162,39,0.7)"
          : "0 7px 20px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10,
          fontWeight: 900,
          color: GOLD,
        }}
      >
        <span>{label}</span>
        <span>{card.overall}</span>
      </div>

      <div
        style={{
          height: 54,
          marginTop: 4,
          borderRadius: 8,
          background: "linear-gradient(180deg, #403823, #211d16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 27,
          overflow: "hidden",
        }}
      >
        {card.photo ? (
          <img
            src={card.photo}
            alt={card.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
        ) : (
          "⚽"
        )}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 11,
          fontWeight: 900,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {card.name}
      </div>

      <div
        style={{
          fontSize: 9,
          opacity: 0.65,
          marginTop: 2,
        }}
      >
        {number ? `#${number} · ` : ""}{card.position}
      </div>
    </button>
  );
}

// Input ganti nomor punggung untuk pemain di slot yang sedang dipilih
function JerseyEditor({ slotId, current, playerName, onSave }) {
  const [val, setVal] = useState(String(current || ""));

  useEffect(() => {
    setVal(String(current || ""));
  }, [current, slotId]);

  const submit = () => onSave(slotId, val);

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        background: PANEL_SOFT,
        border: "1px solid rgba(245,239,224,0.12)",
      }}
    >
      <div style={{ color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
        NO. PUNGGUNG
      </div>
      <div style={{ fontSize: 13, opacity: 0.75, margin: "4px 0 10px" }}>
        {playerName} saat ini nomor <b>{current}</b>. Kalau nomornya sudah dipakai
        pemain lain, nomornya saling ditukar.
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="number"
          min={1}
          max={99}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          style={{
            width: 90,
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${GOLD}`,
            background: BG,
            color: CREAM,
            fontWeight: 900,
            fontSize: 16,
            textAlign: "center",
          }}
        />
        <button onClick={submit} style={buttonStyle()}>
          Simpan Nomor
        </button>
      </div>
    </div>
  );
}

function buttonStyle() {
  return {
    padding: "10px 15px",
    borderRadius: 10,
    border: `1px solid ${GOLD}`,
    background: PANEL_SOFT,
    color: CREAM,
    fontWeight: 900,
    cursor: "pointer",
  };
}

function emptyStyle() {
  return {
    background: PANEL,
    borderRadius: 18,
    padding: 50,
    textAlign: "center",
    border: "1px solid rgba(201,162,39,0.25)",
    opacity: 0.8,
    lineHeight: 1.7,
  };
}


/* ===== INLINE FOOTBALL EXTRAS / PvP / LEAGUE ===== */



const W = 800, H = 500;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = Math.random;
const btn = (on) => ({
  padding: "9px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 900, color: CREAM,
  border: `1px solid ${on ? GOLD : "rgba(245,239,224,.2)"}`,
  background: on ? "rgba(201,162,39,.2)" : SOFT,
});
const box = { background: PANEL, borderRadius: 18, padding: 18, border: "1px solid rgba(201,162,39,.3)" };

/* ================= ENGINE (pemain = lingkaran, real-time) ================= */

const DEF = [[.05,.5],[.2,.15],[.2,.38],[.2,.62],[.2,.85],[.4,.3],[.36,.5],[.4,.7],[.65,.18],[.7,.5],[.65,.82]];

/* geometri lapangan: garis samping/gawang, tinggi mulut gawang, kotak penalti */
const PX = 26, PY = 14, GL0 = PX, GL1 = W - PX, TL0 = PY, TL1 = H - PY, GH = 40, PBD = 132, PBH = 110;
const MIN_RATE = .42; // menit game per detik nyata (lebih lambat = lebih santai)

const gxOf = (t) => (t ? GL0 : GL1);   // gawang yang diserang tim t
const ownX = (t) => (t ? GL1 : GL0);   // gawang milik tim t
const dsc = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const segD = (q, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1;
  const u = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / l, 0, 1);
  return Math.hypot(q.x - (a.x + u * dx), q.y - (a.y + u * dy));
};
const A = (s, t) => s.T[t].atk - 7 * s.rc[t];
const D = (s, t) => s.T[t].def - 7 * s.rc[t];
const act = (s, t) => s.ps.filter((p) => p.team === t && !p.off);
const outf = (s, t) => act(s, t).filter((p) => p.role !== "gk");
const gkOf = (s, t) => act(s, t).find((p) => p.role === "gk");
const byDist = (pt) => (a, c) => dsc(a, pt) - dsc(c, pt);
const wpick = (w) => {
  let tot = 0; for (const k in w) tot += w[k];
  let r = rnd() * tot;
  for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return Object.keys(w)[0];
};
const tname = (s, t) => (s.tn && s.tn[t]) || (t ? "Away" : "Home");
const pname = (p) => p.name || `#${p.num || ((p.i % 11) + 1)}`;
const LBL = { throw: "LEMPARAN KE DALAM", corner: "TENDANGAN POJOK", goalkick: "TENDANGAN GAWANG", freekick: "TENDANGAN BEBAS", penalty: "PENALTI", goal: "GOL!" };

function note(s, txt) {
  s.log.push({ m: Math.min(90, Math.floor(s.min)), t: txt });
  if (s.log.length > 40) s.log.shift();
}

function mkPlayers(team, base, names = [], nums = []) {
  return base.map(([fx, fy], i) => {
    const x = (team ? 1 - fx : fx) * W, y = (team ? 1 - fy : fy) * H;
    return {
      team, i: i + team * 11, x, y, hx: x, hy: y, vx: 0, vy: 0,
      name: names[i] || "",
      num: nums[i] || null,
      role: i === 0 ? "gk" : fx < .3 ? "def" : fx < .55 ? "mid" : "fwd",
      yc: 0, off: false, gone: false, down: 0, dv: null, dvT: 0, dvA: 0
    };
  });
}

const fromSlots = (slots) => slots ? slots.map((s) => [clamp((100 - s.y) / 100, .06, .85), clamp(s.x / 100, .1, .9)]) : DEF;

function initSim(slotsH, slotsA, T, gg, namesH = [], namesA = [], numsH = [], numsA = []) {
  const s = {
    ps: [...mkPlayers(0, fromSlots(slotsH), namesH, numsH), ...mkPlayers(1, fromSlots(slotsA), namesA, numsA)],
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0, z: 0 }, owner: null, mode: "sp", poss: 0, last: 0, score: [0, 0],
    min: 0, t: 0, pause: .6, decide: 1, flight: 0, ft0: 1, zpk: 0, trail: [], flash: null, ht: false, done: false, T, gg,
    // holdReason: null = main game, "stoppage" = substitution window, "halftime" = half time
    holdReason: null, deadReason: null,
    log: [], sp: null, subAvailable: false, subReason: null, pendingSubs: [], subbedOutNames: [], rc: [0, 0], reds: [], cardShow: null, net: null, idle: 0, tn: null,
    stats: { shots: [0, 0], fouls: [0, 0], corners: [0, 0], yc: [0, 0], rc: [0, 0] },
    ref: { x: W / 2 - 30, y: H / 2 + 30 }
  };
  kickoff(s, 0, true);
  return s;
}

function give(s, p) {
  s.owner = p.i; s.mode = "carry"; s.poss = p.team; s.last = p.team; s.decide = .6 + rnd() * .5;
  s.sp = null; s.ball.z = 0; s.ball.vx = s.ball.vy = 0; s.idle = 0;
}

function kickoff(s, team, tp) {
  if (tp) s.ps.forEach((p) => { if (!p.gone) { p.x = p.hx; p.y = p.hy; p.vx = p.vy = 0; } });
  const cand = outf(s, team).filter((p) => p.role === "fwd" || p.role === "mid");
  const o = cand[Math.floor(rnd() * cand.length)] || outf(s, team)[0];
  if (tp) { o.x = W / 2; o.y = H / 2; }
  startSP(s, "kickoff", team, W / 2, H / 2, { wait: tp ? 1.3 : 2.4, taker: o.i });
}

function applySimSubstitution(s, item) {
  if (!item) return;
  const q = s.ps[item.qIndex];
  if (!q || q.off) return;
  const card = item.card || {};
  q.name = card.name || q.name || "";
  q.num = item.num || q.num || null;
  q.role = item.role || q.role;
  q.off = false; q.gone = false; q.down = 0;
  q.dv = null; q.dvT = 0; q.dvA = 0;
  q.hx = q.x; q.hy = q.y;
  if (typeof s.commitSubstitution === "function") s.commitSubstitution(item);
}

function applyPendingSubs(s) {
  if (!s.pendingSubs?.length) return;
  s.pendingSubs.forEach((item) => applySimSubstitution(s, item));
  s.pendingSubs = [];
}

function startSP(s, kind, team, x, y, o = {}) {
  const b = s.ball;
  b.x = x; b.y = y; b.vx = b.vy = 0; b.z = 0;
  s.owner = null; s.mode = "sp"; s.poss = team; s.last = team; s.trail.length = 0;
  const gx = gxOf(team);
  let mates = outf(s, team);
  if (o.victim !== undefined && mates.length > 1) mates = mates.filter((p) => p.i !== o.victim);
  const sp = { kind, team, x, y, t: 0, wait: 1.8, label: LBL[kind] || "", ...o };
  if (sp.taker === undefined) {
    if (kind === "goalkick" || kind === "gkhold") sp.taker = (gkOf(s, team) || mates[0]).i;
    else if (kind === "penalty") {
      sp.taker = mates.slice().sort((a, c) => ((c.role === "fwd") - (a.role === "fwd")) || (Math.abs(a.x - gx) - Math.abs(c.x - gx)))[0].i;
    } else sp.taker = mates.slice().sort(byDist({ x, y }))[0].i;
  }
  const others = mates.filter((p) => p.i !== sp.taker);
  if (kind === "corner") {
    const rk = { fwd: 0, mid: 1, def: 2 };
    sp.atk = others.slice().sort((a, c) => rk[a.role] - rk[c.role] + (rnd() - .5) * .9).slice(0, 5).map((p) => p.i);
    sp.def = outf(s, 1 - team).sort((a, c) => Math.abs(a.x - gx) - Math.abs(c.x - gx)).slice(0, 5).map((p) => p.i);
  } else if (kind === "freekick" && sp.shot) {
    sp.wall = outf(s, 1 - team).sort(byDist({ x, y })).slice(0, 4).map((p) => p.i);
    sp.box = others.slice().sort((a, c) => Math.abs(a.x - gx) - Math.abs(c.x - gx)).slice(0, 3).map((p) => p.i);
  } else if (kind === "throw") {
    sp.opts = others.sort(byDist({ x, y })).slice(0, 2).map((p) => p.i);
    sp.marks = outf(s, 1 - team).sort(byDist({ x, y })).slice(0, 2).map((p) => p.i);
  }
  s.sp = sp;

  // Bola mati = window pergantian pemain, tetapi MATCH TETAP BERJALAN.
  // Kick-off tidak membuka window karena permainan langsung dimulai.
  const subKinds = ["throw", "corner", "goalkick", "freekick", "penalty", "goal"];
  if (subKinds.includes(kind) && !s.done) {
    s.subAvailable = true;
    s.subReason =
      kind === "throw" ? "Bola keluar lapangan" :
      kind === "corner" ? "Tendangan pojok" :
      kind === "goalkick" ? "Tendangan gawang" :
      kind === "penalty" ? "Penalti" :
      kind === "goal" ? "Setelah gol" :
      "Pelanggaran / tendangan bebas";
  }
  return sp;
}

function launch(s, team, tx, ty, spd, mode, zpk = 0) {
  const b = s.ball, d = Math.hypot(tx - b.x, ty - b.y), ft = Math.max(.3, d / spd);
  b.vx = (tx - b.x) / ft; b.vy = (ty - b.y) / ft;
  s.flight = ft; s.ft0 = ft; s.zpk = zpk; s.mode = mode; s.poss = team; s.last = team;
  s.owner = null; s.sp = null; s.lt = { x: tx, y: ty }; s.idle = 0;
  if (mode !== "pass" && mode !== "cross") s.offsideTarget = -1;
}

/* ---------- keputusan pemain ---------- */

function pickPass(s, o) {
  const t = o.team, dir = t ? -1 : 1, opps = outf(s, 1 - t);
  let best = null, bs = -1e9;
  for (const p of outf(s, t)) {
    if (p.i === o.i) continue;
    const d = dsc(o, p);
    if (d < 40 || d > (o.role === "gk" ? 340 : 300)) continue;
    if (o.role === "gk" && p.role === "fwd") continue;      // kiper tidak langsung ke striker
    let open = 999, lane = 999;
    for (const q of opps) { open = Math.min(open, dsc(q, p)); lane = Math.min(lane, segD(q, o, p)); }
    let sc = ((p.x - o.x) * dir) * .011 + Math.min(open, 90) * .022 + Math.min(lane, 60) * .03 - d * .0045 + rnd() * 1.5;
    if (o.role === "def" && p.role === "fwd") sc -= 1.8;   // bek build-up dulu, bukan lambung ke depan
    if (o.role === "mid" && p.role === "def") sc += .3;    // sesekali umpan balik/samping
    if (sc > bs) { bs = sc; best = p; }
  }
  return best || outf(s, t).filter((p) => p.i !== o.i).sort(byDist(o))[0];
}

function isOffsideAtPass(s, passer, receiver) {
  if (!receiver || receiver.team !== passer.team || receiver.role === "gk") return false;
  const t = passer.team, dir = t ? -1 : 1;
  // Offside hanya mungkin di area lawan dan penerima harus lebih dekat ke gawang
  // daripada bola serta pemain bertahan kedua terakhir saat umpan dilepas.
  const halfway = W / 2;
  const inOppHalf = t === 0 ? receiver.x > halfway : receiver.x < halfway;
  if (!inOppHalf) return false;
  if (t === 0 && receiver.x <= passer.x) return false;
  if (t === 1 && receiver.x >= passer.x) return false;
  const defenders = outf(s, 1 - t).filter((p) => !p.off && !p.gone).sort((a, b) =>
    t === 0 ? b.x - a.x : a.x - b.x
  );
  if (defenders.length < 2) return false;
  const secondLast = defenders[1];
  return t === 0 ? receiver.x > secondLast.x : receiver.x < secondLast.x;
}

function doPass(s, o) {
  const t = o.team, c = pickPass(s, o);
  if (!c) { s.decide = .5; return; }
  const d = dsc(o, c);
  let tx = clamp(c.x + c.vx * .45, GL0 + 8, GL1 - 8), ty = clamp(c.y + c.vy * .45, TL0 + 8, TL1 - 8);
  const err = clamp(.045 + d / 2600 - (A(s, t) - D(s, 1 - t)) / 1500, .02, .16);
  let mode = "pass";
  s.ball.x = o.x; s.ball.y = o.y;
  if (rnd() < err) {
    const nearTouch = Math.min(ty - TL0, TL1 - ty) < 85, nearEnd = Math.min(tx - GL0, GL1 - tx) < 60;
    if ((nearTouch || nearEnd) && rnd() < .6) {          // umpan kelewat jauh -> keluar lapangan
      if (nearTouch) ty = ty < H / 2 ? TL0 - 22 : TL1 + 22; else tx = tx < W / 2 ? GL0 - 22 : GL1 + 22;
      mode = "outpass";
    } else { tx = clamp(tx + (rnd() - .5) * 110, GL0 + 8, GL1 - 8); ty = clamp(ty + (rnd() - .5) * 110, TL0 + 8, TL1 - 8); mode = "loose"; }
  }
  s.target = c.i;
  s.offsideTarget = mode === "pass" && isOffsideAtPass(s, o, c) ? c.i : -1;
  launch(s, t, tx, ty, d > 190 ? 262 : 228, mode, d > 190 ? 26 : 0);
}

function cross(s, o) {
  const t = o.team, gx = gxOf(t), dir = t ? -1 : 1;
  const tx = gx - dir * (48 + rnd() * 60), ty = H / 2 + (rnd() - .5) * 90;
  const tg = outf(s, t).filter((p) => p.i !== o.i).sort(byDist({ x: tx, y: ty }))[0];
  s.ball.x = o.x; s.ball.y = o.y; s.target = tg.i; s.offsideTarget = isOffsideAtPass(s, o, tg) ? tg.i : -1; s.xk = "cross";
  s.flash = { text: "UMPAN SILANG", t: .9 };
  launch(s, t, tx, ty, 250, "cross", 52);
}

function decide(s, o) {
  const gx = gxOf(o.team), dg = Math.abs(o.x - gx), off = Math.abs(o.y - H / 2);
  let press = 999;
  for (const q of act(s, 1 - o.team)) press = Math.min(press, dsc(q, o));
  if (dg < 178 && off < 150 && rnd() < .5) return shoot(s, o);
  if (dg >= 178 && dg < 290 && o.role !== "def" && rnd() < .08) return shoot(s, o, { long: true });
  if (dg < 250 && off > 150 && o.role !== "def" && rnd() < .34) return cross(s, o);
  if (rnd() < (press < 60 ? .9 : .74)) return doPass(s, o);
  s.decide = .4 + rnd() * .4;
}

function shoot(s, o, opt = {}) {
  const t = o.team, opp = 1 - t, gx = gxOf(t), outw = t ? -1 : 1;
  const diff = A(s, t) - D(s, opp);
  const w = opt.w || { goal: clamp(.18 + diff / 240, .05, .38) * (opt.long ? .55 : 1), save: .36, block: .13, miss: .34 };
  const out = wpick(w);
  s.out = out; s.st = t; s.shooter = o.i; s.over = false; s.blk = -1;
  const gk = gkOf(s, opp);
  const side = rnd() < .5 ? -1 : 1;
  let tx, ty, zpk = opt.zpk ?? 10;
  if (out === "goal") {
    ty = H / 2 + side * (14 + rnd() * (GH - 22));
    if (gk && Math.abs(ty - gk.y) < 26) ty = H / 2 + (gk.y >= H / 2 ? -1 : 1) * (18 + rnd() * (GH - 26));
    tx = gx + outw * 12;                                   // masuk ke jaring gawang
  } else if (out === "save") {
    ty = clamp((gk ? gk.y : H / 2) + (rnd() - .5) * 64, H / 2 - GH + 6, H / 2 + GH - 6);
    tx = gx - outw * 18;                                   // di depan garis, terjangkau kiper
  } else if (out === "miss") {
    if (rnd() < .35) { ty = H / 2 + side * (8 + rnd() * 28); zpk = 64; s.over = true; }
    else ty = H / 2 + side * (GH + 12 + rnd() * 44);
    tx = gx + outw * 14;
  } else {
    const dx = gx - o.x, dy = H / 2 - o.y, l = Math.hypot(dx, dy) || 1, d = out === "wall" ? 68 : 52 + rnd() * 30;
    tx = clamp(o.x + dx / l * d, GL0 + 8, GL1 - 8); ty = clamp(o.y + dy / l * d, TL0 + 8, TL1 - 8);
    if (out === "block") {
      const bl = outf(s, opp).sort(byDist({ x: tx, y: ty }))[0];
      if (bl) s.blk = bl.i;
    }
  }
  s.ball.x = o.x; s.ball.y = o.y; s.ball.z = 0;
  launch(s, t, tx, ty, opt.spd ?? 380, "shot", zpk);
  s.stats.shots[t]++;
  if (gk && (out === "goal" || out === "save")) {         // kiper melompat ke arah bola
    const inw = -outw;
    gk.dv = out === "save" ? { x: tx, y: ty } : { x: gx + inw * 14, y: gk.y + (ty - gk.y) * .72 };
    gk.dvT = .95; gk.dvA = Math.atan2(-(gk.dv.x - gk.x) * .3, (gk.dv.y - gk.y) || .001);
  }
}

/* ---------- foul, kartu, dan bola mati ---------- */

function foul(s, v, c) {
  const t = c.team, vt = v.team;
  s.stats.fouls[t]++;
  v.down = 1.6;
  let card = null;
  const r = rnd();
  if (r < .025) card = "red";
  else if (r < .22) card = c.yc ? "red2" : "yellow";
  if (card === "yellow") { c.yc = 1; s.stats.yc[t]++; }
  const isRed = card === "red" || card === "red2";
  if (isRed) { c.off = true; s.rc[t]++; s.stats.rc[t]++; s.reds.push({ team: t, idx: c.i % 11, name: c.name }); }
  const nm = `${pname(c)} (${tname(s, t)})`;
  if (card === "yellow") { s.flash = { text: "🟨 KARTU KUNING", t: 2.2 }; s.cardShow = { p: c, color: "#f4d21f", t: 2.6 }; note(s, `🟨 Kartu kuning: ${nm}`); }
  else if (card === "red") { s.flash = { text: "🟥 KARTU MERAH!", t: 2.4 }; s.cardShow = { p: c, color: "#e0262b", t: 2.8 }; note(s, `🟥 Kartu merah langsung: ${nm}`); }
  else if (card === "red2") { s.flash = { text: "🟨🟥 KUNING KEDUA = MERAH", t: 2.4 }; s.cardShow = { p: c, color: "#e0262b", t: 2.8 }; note(s, `🟨🟥 Kartu kuning kedua → merah: ${nm}`); }
  else { s.flash = { text: "🚨 PELANGGARAN!", t: 1.3 }; note(s, `🚨 Pelanggaran oleh ${nm}`); }
  const extra = card ? 2 : 0, bx = v.x, by = v.y, vg = gxOf(vt), pdir = vt ? -1 : 1;
  const dgx = Math.abs(bx - vg), off = Math.abs(by - H / 2);
  if (dgx < PBD - 4 && off < PBH - 6) {
    note(s, `⚠️ Penalti untuk ${tname(s, vt)}!`);
    startSP(s, "penalty", vt, vg - pdir * 84, H / 2, { wait: 3.8 + extra, victim: v.i });
  } else if (dgx < 265 && off < 200) startSP(s, "freekick", vt, bx, by, { shot: true, wait: 3.4 + extra, victim: v.i });
  else startSP(s, "freekick", vt, bx, by, { shot: false, wait: 1.7 + extra, victim: v.i });
}

function outBall(s, x, y) {
  const last = s.last;
  s.flash = { text: "OUT!", t: 1 };
  if (y < TL0 || y > TL1) {
    startSP(s, "throw", 1 - last, clamp(x, GL0 + 30, GL1 - 30), y < H / 2 ? TL0 : TL1, { wait: 2 });
  } else {
    const defTeam = x <= GL0 ? 0 : 1;
    if (last === defTeam) {
      const team = 1 - defTeam;
      s.stats.corners[team]++;
      note(s, `🚩 Tendangan pojok untuk ${tname(s, team)}`);
      startSP(s, "corner", team, defTeam === 0 ? GL0 + 3 : GL1 - 3, y < H / 2 ? TL0 + 3 : TL1 - 3, { wait: 3 });
    } else {
      startSP(s, "goalkick", defTeam, defTeam === 0 ? GL0 + 42 : GL1 - 42, H / 2 + (rnd() < .5 ? -1 : 1) * 22, { wait: 1.9 });
    }
  }
}

function runSP(s) {
  const sp = s.sp, k = sp.kind, t = sp.team, tk = s.ps[sp.taker], b = s.ball;
  const dir = t ? -1 : 1, gx = gxOf(t);
  if (k === "kickoff") { give(s, tk); s.decide = .35; }
  else if (k === "throw") {
    const opts = sp.opts.map((i) => s.ps[i]).filter((p) => !p.off);
    const c = opts[Math.floor(rnd() * opts.length)] || outf(s, t).filter((p) => p.i !== tk.i).sort(byDist(tk))[0];
    s.target = c.i;
    launch(s, t, c.x, c.y, 190, "pass", 22);
  } else if (k === "goalkick" || k === "gkhold") { doPass(s, tk); }
  else if (k === "corner") {
    const tx = gx - dir * (50 + rnd() * 70), ty = H / 2 + (rnd() - .5) * 110;
    const pool = sp.atk.map((i) => s.ps[i]).filter((p) => !p.off);
    const tg = pool.sort(byDist({ x: tx, y: ty }))[0] || outf(s, t)[0];
    s.target = tg.i; s.xk = "corner";
    launch(s, t, tx, ty, 245, "cross", 58);
  } else if (k === "freekick") {
    if (sp.shot) {
      const dg = Math.abs(sp.x - gx), pg = clamp(.075 + (A(s, t) - D(s, 1 - t)) / 600 - dg / 2600, .03, .18);
      shoot(s, tk, { w: { goal: pg, wall: .22, save: .27, miss: .38 }, spd: 350, zpk: 24 });
    } else { give(s, tk); s.decide = .3; }
  } else if (k === "penalty") {
    shoot(s, tk, { w: { goal: .76, save: .14, miss: .10 }, spd: 330, zpk: 4 });
  } else if (k === "goal") {
    if (s.gg) { s.done = true; s.sp = null; return; }
    kickoff(s, 1 - t, false);
  }
}

function resolveShot(s) {
  const t = s.st, opp = 1 - t, sh = s.ps[s.shooter], b = s.ball, out = s.out;
  const gk = gkOf(s, opp), outw = t ? -1 : 1, inw = -outw, gx = gxOf(t);
  s.ps.forEach((p) => { if (p.dv) p.dv = null; });
  if (out === "goal") {
    s.score[t]++;
    s.flash = { text: `⚽ GOAL! ${sh.name}`.trim(), t: 3 };
    s.net = { team: t, t: 1.3 };
    note(s, `⚽ GOL! ${pname(sh)} (${tname(s, t)}) — ${s.score[0]}-${s.score[1]}`);
    startSP(s, "goal", t, b.x, b.y, { taker: sh.i, wait: 3.4 });
  } else if (out === "save") {
    const r = rnd();
    s.last = opp;
    if (r < .62) {
      s.flash = { text: "🧤 SAVE!", t: 1.6 };
      note(s, `🧤 Penyelamatan ${gk ? pname(gk) : "kiper"} atas tembakan ${pname(sh)}`);
      startSP(s, "gkhold", opp, gk.x, gk.y, { taker: gk.i, wait: 1.5 + rnd() * .5, label: "" });
    } else {
      s.flash = { text: "🧤 DITEPIS KIPER!", t: 1.5 };
      if (rnd() < .5) {
        s.ball.x = gk.x; s.ball.y = gk.y;
        launch(s, opp, gx + outw * 20, H / 2 + (gk.y < H / 2 ? -1 : 1) * (GH + 34), 210, "outpass", 14);
      } else {
        s.ball.x = gk.x; s.ball.y = gk.y;
        launch(s, opp, clamp(gk.x + inw * (45 + rnd() * 30), GL0 + 10, GL1 - 10), clamp(gk.y + (rnd() - .5) * 150, TL0 + 10, TL1 - 10), 190, "loose", 22);
      }
    }
  } else if (out === "miss") {
    s.flash = { text: s.over ? "⬆ DI ATAS GAWANG" : "💨 MELESET", t: 1.3 };
    note(s, `💨 Tembakan ${pname(sh)} ${s.over ? "melambung di atas mistar" : "melebar dari gawang"}`);
    outBall(s, b.x, b.y);
  } else if (out === "wall") {
    s.flash = { text: "🧱 DIHADANG PAGAR BETIS", t: 1.4 };
    note(s, `🧱 Tendangan bebas ${pname(sh)} membentur pagar betis`);
    launch(s, opp, clamp(b.x + (rnd() - .5) * 120, GL0 + 10, GL1 - 10), clamp(b.y + (rnd() - .5) * 120, TL0 + 10, TL1 - 10), 190, "loose", 16);
    s.last = opp;
  } else { // block
    s.flash = { text: "🛡 DIBLOK!", t: 1.2 };
    note(s, `🛡 Tembakan ${pname(sh)} diblok pemain bertahan`);
    if (rnd() < .35) launch(s, opp, gx + outw * 20, H / 2 + (b.y < H / 2 ? -1 : 1) * (GH + 40), 200, "outpass", 10);
    else launch(s, opp, clamp(b.x + (rnd() - .5) * 140, GL0 + 10, GL1 - 10), clamp(b.y + (rnd() - .5) * 140, TL0 + 10, TL1 - 10), 190, "loose", 14);
    s.last = opp;
  }
}

function resolveCross(s) {
  const t = s.poss, opp = 1 - t, b = s.ball, isC = s.xk === "corner", gx = gxOf(t), outw = t ? -1 : 1;
  const atk = outf(s, t).sort(byDist(b))[0], dfd = outf(s, opp).sort(byDist(b))[0], gk = gkOf(s, opp);
  const pg = clamp((isC ? .10 : .07) + (A(s, t) - D(s, opp)) / 380, .03, .22);
  const w = { goal: pg, save: .17, wide: .13, clear: .34, claim: .22 };
  if (!isC) w.out = .12;
  const r = wpick(w);
  if (r === "goal" || r === "save" || r === "wide") {
    note(s, isC ? `🚩 Sundulan ${pname(atk)} dari tendangan pojok` : `🎯 Sundulan ${pname(atk)} dari umpan silang`);
    shoot(s, atk, { w: r === "goal" ? { goal: 1 } : r === "save" ? { save: 1 } : { miss: 1 }, spd: 300, zpk: 8 });
  } else if (r === "clear") {
    s.flash = { text: "DIBUANG BEK!", t: 1 };
    b.x = dfd.x; b.y = dfd.y;
    launch(s, opp, clamp(gx - outw * (215 + rnd() * 70), GL0 + 10, GL1 - 10), clamp(H / 2 + (rnd() - .5) * 320, TL0 + 10, TL1 - 10), 250, "loose", 50);
  } else if (r === "claim") {
    s.flash = { text: "🧤 KIPER MENANGKAP BOLA", t: 1.2 };
    s.last = opp;
    startSP(s, "gkhold", opp, gk.x, gk.y, { taker: gk.i, wait: 1.4, label: "" });
  } else {
    s.last = t;
    outBall(s, gx + outw * 10, H / 2 + (rnd() < .5 ? -1 : 1) * 60);
  }
}

function land(s) {
  const ps = s.ps, b = s.ball, m = s.mode;
  b.x = s.lt.x; b.y = s.lt.y; b.z = 0;
  if ((m === "pass" || m === "cross") && s.offsideTarget >= 0) {
    const offP = ps[s.offsideTarget];
    const defendingTeam = 1 - s.poss;
    s.flash = { text: "🚩 OFFSIDE!", t: 1.8 };
    note(s, `🚩 Offside — ${pname(offP)} (${tname(s, s.poss)})`);
    s.offsideTarget = -1;
    startSP(s, "freekick", defendingTeam, s.lt.x, s.lt.y, { shot: false, wait: 1.8 });
    return;
  }
  if (m === "pass") {
    let r = ps[s.target];
    if (!r || r.off || dsc(r, s.lt) > 45) r = outf(s, s.poss).sort(byDist(s.lt))[0];
    const opp = outf(s, 1 - r.team).sort(byDist(s.lt))[0];
    const cut = opp && dsc(opp, s.lt) < 45 && rnd() < clamp(.2 - (A(s, r.team) - D(s, 1 - r.team)) / 400, .05, .35);
    give(s, cut ? opp : r);
  } else if (m === "loose") {
    const c = act(s, 0).concat(act(s, 1)).filter((p) => p.role !== "gk" || dsc(p, s.lt) < 45).sort(byDist(s.lt))[0];
    give(s, c);
  } else if (m === "outpass") outBall(s, s.lt.x, s.lt.y);
  else if (m === "shot") resolveShot(s);
  else if (m === "cross") resolveCross(s);
  else give(s, outf(s, s.poss).sort(byDist(s.lt))[0]);
}

/* ---------- posisi pemain saat bola mati ---------- */

const CB = [[70, -45], [58, 8], [88, 40], [104, -14], [126, 22]];

function spTarget(s, p) {
  const sp = s.sp, k = sp.kind, t = sp.team, dir = t ? -1 : 1, gx = gxOf(t), mine = p.team === t;
  if (k === "gkhold") return null;
  if (k === "goal") {
    const cy = sp.y < H / 2 ? TL0 + 30 : TL1 - 30;
    if (p.i === sp.taker) return [gx - dir * 40, cy, 92];
    if (mine) return [(p.x + gx - dir * 70) / 2, (p.y + cy) / 2, 58];
    return [p.hx, p.hy, 32];
  }
  if (k === "kickoff") {
    if (p.i === sp.taker) return [W / 2 - dir * 6, H / 2, 80];
    return [t === 0 || p.team === 0 ? Math.min(p.hx, W / 2 - 30) : Math.max(p.hx, W / 2 + 30), p.hy, 100];
  }
  if (p.i === sp.taker) {
    if (k === "penalty" || (k === "freekick" && sp.shot)) {
      const dx = gx - sp.x, dy = H / 2 - sp.y, l = Math.hypot(dx, dy) || 1, back = sp.t < sp.wait - .85 ? 38 : 0;
      return [sp.x - dx / l * back, sp.y - dy / l * back, back ? 80 : 65];
    }
    return [sp.x, sp.y, 80];
  }
  if (k === "freekick" && sp.shot) {
    const dx = gx - sp.x, dy = H / 2 - sp.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    const wi = sp.wall.indexOf(p.i);
    if (wi >= 0) return [sp.x + ux * 68 - uy * (wi - 1.5) * 22, sp.y + uy * 68 + ux * (wi - 1.5) * 22, 70];
    const bi = sp.box.indexOf(p.i);
    if (bi >= 0) return [gx - dir * (62 + bi * 26), H / 2 + (bi - 1) * 50, 60];
  } else if (k === "corner") {
    const ai = sp.atk.indexOf(p.i);
    if (ai >= 0) return [gx - dir * CB[ai][0], H / 2 + CB[ai][1], 55];
    const di = sp.def.indexOf(p.i);
    if (di >= 0) return [gx - dir * (CB[di][0] - 8), H / 2 + CB[di][1] + (di % 2 ? 10 : -10), 55];
  } else if (k === "throw") {
    const inward = sp.y < H / 2 ? 1 : -1, oi = sp.opts.indexOf(p.i);
    if (oi >= 0) return [sp.x + [dir * 38, -dir * 34][oi], sp.y + inward * [70, 52][oi], 62];
    const mi = sp.marks.indexOf(p.i);
    if (mi >= 0) return [sp.x + [dir * 38, -dir * 34][mi] - dir * 8, sp.y + inward * [70, 52][mi] + inward * 8, 62];
  } else if (k === "penalty") {
    if (p.role === "gk" && !mine) return [ownX(p.team) + (p.team ? -1 : 1) * 8, H / 2, 40];
    if (p.role !== "gk") return [gx - dir * (160 + (p.i % 5) * 10), H / 2 + ((p.i % 7) - 3) * 38, 70];
  }
  return null;
}

function shapeT(s, p, chase, nn, sup) {
  const b = s.ball, dir = p.team ? -1 : 1, att = p.team === s.poss, R = p.role;
  const push = att ? (R === "fwd" ? 95 : R === "mid" ? 62 : 30) : (R === "fwd" ? -12 : R === "mid" ? -18 : -22);
  let tx = p.hx + dir * push + (b.x - W / 2) * .26;
  let ty = p.hy + (b.y - H / 2) * .2 + Math.sin(s.t * .8 + p.i * 1.7) * 8;
  let sp = 44;
  if (att && R === "fwd") tx += dir * Math.max(0, Math.sin(s.t * .55 + p.i * 2.3)) * 32;   // lari membelah garis belakang
  if (att && sup[p.i] !== undefined && s.owner != null) {                                  // beri opsi umpan (segitiga)
    const o = s.ps[s.owner], k = sup[p.i];
    tx = tx * .45 + (o.x + dir * (k ? 8 : 42)) * .55;
    ty = ty * .4 + clamp(o.y + (k ? -1 : 1) * 72, TL0 + 20, TL1 - 20) * .6;
    sp = 54;
  }
  if (!att && (R === "def" || R === "mid") && s.mode === "carry") {                        // menjaga lawan terdekat
    let q = null, bd = 130;
    for (const z of s.ps) if (z.team !== p.team && !z.off && z.role !== "gk") { const d = dsc(z, p); if (d < bd) { bd = d; q = z; } }
    if (q) { tx = tx * .45 + (q.x + (ownX(p.team) - q.x) * .22) * .55; ty = ty * .4 + q.y * .6; }
  }
  if (chase && !att && p.i === nn[p.team]) { tx = b.x; ty = b.y; sp = 64; }
  return [clamp(tx, GL0 + 22, GL1 - 22), clamp(ty, TL0 + 16, TL1 - 16), sp];
}

function step(s, dt) {
  if (s.done) return;
  if (s.flash) { s.flash.t -= dt; if (s.flash.t <= 0) s.flash = null; }
  if (s.cardShow) { s.cardShow.t -= dt; if (s.cardShow.t <= 0) s.cardShow = null; }
  if (s.net) { s.net.t -= dt; if (s.net.t <= 0) s.net = null; }
  if (s.hold) return;
  if (s.pause > 0) { s.pause -= dt; return; }
  s.min += dt * MIN_RATE; s.t += dt;
  if (!s.ht && s.min >= 45) {
    s.ht = true; s.sp = null; s.subAvailable = false; s.subReason = null;
    kickoff(s, 1, true); s.pause = 1.2;
    note(s, "⏱ Babak pertama selesai");
    if (s.hb) {
      s.hold = true;
      s.holdReason = "halftime";
      s.deadReason = null;
      s.flash = { text: "⏸ HALF TIME", t: 1e6 };
    } else s.flash = { text: "BABAK KEDUA", t: 1.5 };
    return;
  }
  if (s.min >= 90) { s.done = true; note(s, "🏁 Peluit panjang — pertandingan selesai"); return; }
  const b = s.ball, ps = s.ps;
  const fly = s.mode !== "carry" && s.mode !== "sp";

  if (s.mode === "carry") {
    const o = ps[s.owner];
    if (!o || o.off) { const c = outf(s, s.poss).sort(byDist(b))[0]; give(s, c); return; }
    const sv = Math.hypot(o.vx, o.vy), kb = Math.min(1, dt * 14);
    const hx = sv > 5 ? o.vx / sv : o.team ? -1 : 1, hy = sv > 5 ? o.vy / sv : 0;
    b.x += (o.x + hx * 9 - b.x) * kb; b.y += (o.y + hy * 9 - b.y) * kb;
    for (const q of ps) {
      if (q.team !== o.team && !q.off && !q.gone && q.role !== "gk" && q.down <= 0 && dsc(q, o) < 27 &&
        rnd() < dt * clamp(.42 + (D(s, q.team) - A(s, o.team)) / 110, .12, 1)) {
        const inBox = Math.abs(o.x - gxOf(o.team)) < PBD - 4 && Math.abs(o.y - H / 2) < PBH - 6;
        if (rnd() < (inBox ? .09 : .26)) foul(s, o, q); else give(s, q);
        return;
      }
    }
    s.decide -= dt;
    if (s.decide <= 0) decide(s, o);
  } else if (s.mode === "sp") {
    const sp = s.sp; sp.t += dt;
    if (sp.kind === "gkhold") { const g = ps[sp.taker]; b.x = g.x + (g.team ? -1 : 1) * 7; b.y = g.y; b.z = 8; }
    if (sp.t >= sp.wait) {
      applyPendingSubs(s);
      s.subAvailable = false;
      s.subReason = null;
      runSP(s);
    }
  } else {
    b.x += b.vx * dt; b.y += b.vy * dt; s.flight -= dt;
    const f = clamp(1 - s.flight / s.ft0, 0, 1); b.z = 4 * s.zpk * f * (1 - f);
    if (s.flight <= 0) land(s);
  }
  if (s.mode === "sp" && s.sp && s.sp.kind !== "gkhold") s.trail.length = 0;
  else { s.trail.push({ x: b.x, y: b.y }); if (s.trail.length > 9) s.trail.shift(); }

  // wasit mengikuti bola
  const rf = s.ref, kr = Math.min(1, dt * 1.4);
  rf.x += (clamp(b.x - 26, GL0 + 10, GL1 - 10) - rf.x) * kr; rf.y += (clamp(b.y + 26, TL0 + 10, TL1 - 10) - rf.y) * kr;

  // jaga-jaga: tidak ada yang memegang bola terlalu lama
  if (s.mode === "carry" && s.owner == null) { s.idle += dt; if (s.idle > 4) give(s, outf(s, s.poss).sort(byDist(b))[0]); }

  const chaseOk = s.mode === "carry" || fly;
  const nn = [0, 1].map((t) => { const c = outf(s, t).sort(byDist(b))[0]; return c ? c.i : -1; });
  const sup = {};
  if (s.mode === "carry" && s.owner != null) {
    const o = ps[s.owner];
    outf(s, o.team).filter((p) => p.i !== o.i).sort(byDist(o)).slice(0, 2).forEach((p, k) => { sup[p.i] = k; });
  }
  let ic = -1;
  if (s.mode === "pass" || s.mode === "cross") { const q = outf(s, 1 - s.poss).sort(byDist(s.lt))[0]; if (q && dsc(q, s.lt) < 110) ic = q.i; }
  let lo = [-1, -1];
  if (s.mode === "loose") lo = [0, 1].map((t) => { const c = outf(s, t).sort(byDist(s.lt))[0]; return c ? c.i : -1; });

  for (const p of ps) {
    if (p.gone) continue;
    if (p.down > 0) { p.down -= dt; p.vx = p.vy = 0; continue; }
    if (p.dvT > 0) p.dvT -= dt;
    if (p.dv) {                                           // kiper melompat
      const dx = p.dv.x - p.x, dy = p.dv.y - p.y, d = Math.hypot(dx, dy);
      const spd = Math.min(300, d / Math.max(.1, s.flight * .9)), mv = Math.min(d, spd * dt);
      if (d > .5) { p.x += dx / d * mv; p.y += dy / d * mv; p.vx = dx / d * spd; p.vy = dy / d * spd; }
      continue;
    }
    let tx, ty, sp = 44, free = false;
    if (p.off) { tx = p.x; ty = p.y < H / 2 ? -40 : H + 40; sp = 66; free = true; }
    else {
      const sT = s.mode === "sp" ? spTarget(s, p) : null;
      if (sT) { tx = sT[0]; ty = sT[1]; sp = sT[2]; }
      else if (p.i === s.owner) { tx = gxOf(p.team); ty = H / 2 + Math.sin(s.t * 1.3 + p.i) * 100; sp = 46; }
      else if (p.role === "gk") {
        const inw = p.team ? -1 : 1;
        tx = p.hx; ty = H / 2 + clamp(b.y - H / 2, -42, 42) * .85; sp = 40;
        if (s.mode === "sp" && s.sp.kind === "goal") { tx = p.hx; ty = p.y; sp = 20; }
      } else if ((s.mode === "pass" || s.mode === "cross") && p.i === s.target) { tx = s.lt.x; ty = s.lt.y; sp = 105; }
      else if (p.i === ic || p.i === lo[p.team]) { tx = s.lt.x; ty = s.lt.y; sp = p.i === ic ? 88 : 95; }
      else if (s.mode === "shot" && p.i === s.blk) { tx = s.lt.x; ty = s.lt.y; sp = 140; }
      else [tx, ty, sp] = shapeT(s, p, chaseOk, nn, sup);
    }
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1;
    const v = sp * (1 + (s.T[p.team].atk - 70) / 400) * Math.min(1, d / 24), k = Math.min(1, dt * 5);
    p.vx += ((dx / d) * v - p.vx) * k; p.vy += ((dy / d) * v - p.vy) * k;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (free) { if (p.y < 2 || p.y > H - 2) { p.gone = true; p.x = -100; p.y = -100; } }
    else { p.x = clamp(p.x, GL0 - 4, GL1 + 4); p.y = clamp(p.y, TL0 - 4, TL1 + 4); }
  }
  const wall = s.mode === "sp" && s.sp.wall ? s.sp.wall : null;
  for (let i = 0; i < 22; i++) {
    const a = ps[i]; if (a.gone || a.off) continue;
    for (let j = i + 1; j < 22; j++) {
      const c = ps[j]; if (c.gone || c.off) continue;
      if (wall && wall.includes(a.i) && wall.includes(c.i)) continue;
      const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
      if (d > 0 && d < 24) { const f = ((24 - d) / d) * .25; a.x -= dx * f; a.y -= dy * f; c.x += dx * f; c.y += dy * f; }
    }
  }
}

/* ---------- gambar ---------- */

function draw(c, s, cols) {
  for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? "#1f5a2f" : "#246a36"; c.fillRect(i * W / 12, 0, W / 12 + 1, H); }
  const L = "rgba(255,255,255,.78)";
  c.strokeStyle = L; c.lineWidth = 2;
  c.strokeRect(GL0, TL0, GL1 - GL0, TL1 - TL0);
  c.beginPath(); c.moveTo(W / 2, TL0); c.lineTo(W / 2, TL1); c.stroke();
  c.beginPath(); c.arc(W / 2, H / 2, 55, 0, 7); c.stroke();
  c.fillStyle = L; c.beginPath(); c.arc(W / 2, H / 2, 3, 0, 7); c.fill();
  for (const sd of [0, 1]) {
    const gl = sd ? GL1 : GL0, dr = sd ? -1 : 1;
    c.strokeStyle = L;
    c.strokeRect(sd ? gl - PBD : gl, H / 2 - PBH, PBD, PBH * 2);
    c.strokeRect(sd ? gl - 48 : gl, H / 2 - 54, 48, 108);
    c.beginPath(); c.arc(gl + dr * 84, H / 2, 3, 0, 7); c.fill();
    c.beginPath(); c.arc(gl + dr * 84, H / 2, 55, sd ? Math.PI - .93 : -.93, sd ? Math.PI + .93 : .93); c.stroke();
    // gawang + jaring
    const rip = s.net && s.net.t > 0 && s.net.team === (sd ? 0 : 1) ? s.net.t : 0;
    c.fillStyle = `rgba(255,255,255,${.14 + rip * .3})`;
    c.fillRect(sd ? gl : gl - 16, H / 2 - GH, 16, GH * 2);
    c.strokeStyle = `rgba(255,255,255,${.35 + rip * .4})`; c.lineWidth = 1;
    for (let y = H / 2 - GH; y <= H / 2 + GH; y += 8) { c.beginPath(); c.moveTo(sd ? gl : gl - 16, y); c.lineTo(sd ? gl + 16 : gl, y); c.stroke(); }
    for (let x = 0; x <= 16; x += 4) { c.beginPath(); c.moveTo((sd ? gl : gl - 16) + x, H / 2 - GH); c.lineTo((sd ? gl : gl - 16) + x, H / 2 + GH); c.stroke(); }
    c.strokeStyle = "#fff"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(sd ? gl + 16 : gl - 16, H / 2 - GH); c.lineTo(gl, H / 2 - GH); c.lineTo(gl, H / 2 + GH); c.lineTo(sd ? gl + 16 : gl - 16, H / 2 + GH); c.stroke();
    c.lineWidth = 2;
  }
  // bendera + busur pojok
  for (const [fx, fy] of [[GL0, TL0], [GL1, TL0], [GL0, TL1], [GL1, TL1]]) {
    c.strokeStyle = L; c.lineWidth = 1.5;
    c.beginPath(); c.arc(fx, fy, 10, fx < W / 2 ? (fy < H / 2 ? 0 : -Math.PI / 2) : (fy < H / 2 ? Math.PI / 2 : Math.PI), fx < W / 2 ? (fy < H / 2 ? Math.PI / 2 : 0) : (fy < H / 2 ? Math.PI : Math.PI * 1.5)); c.stroke();
    c.fillStyle = "#ff3b30"; c.fillRect(fx - 1, fy - 12, 8 * (fx < W / 2 ? 1 : -1), 6);
    c.fillStyle = "#fff"; c.fillRect(fx - 1, fy - 12, 2, 14);
  }
  (s.trail || []).forEach((t, k) => { c.fillStyle = `rgba(255,255,255,${k / 30})`; c.beginPath(); c.arc(t.x, t.y, 4, 0, 7); c.fill(); });
  c.textAlign = "center"; c.textBaseline = "middle";

  const b = s.ball, bz = b.z || 0;
  for (const p of s.ps) {
    if (p.gone || p.x < -20) continue;
    const gk = p.role ? p.role === "gk" : p.i % 11 === 0;
    const col = gk ? (p.team ? "#2fcf6e" : "#f2c500") : cols[p.team];
    const own = p.i === s.owner;
    c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(p.x, p.y + 9, 11, 4, 0, 0, 7); c.fill();
    if (p.down > 0) {                                        // terjatuh
      c.save(); c.translate(p.x, p.y + 3); c.rotate(.5);
      c.beginPath(); c.ellipse(0, 0, 16, 8, 0, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = "#fff"; c.stroke(); c.restore();
    } else if (p.dvT > 0 && gk) {                            // kiper melompat
      c.save(); c.translate(p.x, p.y); c.rotate(p.dvA || 0);
      c.beginPath(); c.ellipse(0, 0, 8, 17, 0, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = "#fff"; c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -19, 4, 0, 7); c.fill(); c.beginPath(); c.arc(0, 19, 4, 0, 7); c.fill();
      c.restore();
    } else {
      c.beginPath(); c.arc(p.x, p.y, 12, 0, 7); c.fillStyle = col; c.fill();
      c.lineWidth = own ? 3 : 1.5; c.strokeStyle = own ? GOLD : "#fff"; c.stroke();
      c.fillStyle = "#fff"; c.font = "bold 10px Arial"; c.fillText(String(p.num || ((p.i % 11) + 1)), p.x, p.y + .5);
    }
    if (p.yc && !p.off) { c.fillStyle = "#f4d21f"; c.fillRect(p.x + 8, p.y - 17, 6, 9); }
    if (p.name) {
      c.font = "bold 9px Arial";
      const label = String(p.name).length > 15 ? `${String(p.name).slice(0, 14)}…` : String(p.name);
      const tw = c.measureText(label).width;
      c.fillStyle = "rgba(0,0,0,.68)"; c.fillRect(p.x - tw / 2 - 4, p.y - 25, tw + 8, 13);
      c.fillStyle = "#fff"; c.fillText(label, p.x, p.y - 18.5);
    }
  }
  if (s.ref) {                                               // wasit
    c.beginPath(); c.arc(s.ref.x, s.ref.y, 8, 0, 7); c.fillStyle = "#111"; c.fill(); c.lineWidth = 2; c.strokeStyle = "#ffd60a"; c.stroke();
  }
  if (s.cardShow && s.cardShow.p) {                          // kartu diangkat wasit
    const cp = s.cardShow.p, rr = s.ref || cp;
    c.fillStyle = s.cardShow.color; c.fillRect(rr.x - 7, rr.y - 38, 14, 20); c.lineWidth = 1.5; c.strokeStyle = "#fff"; c.strokeRect(rr.x - 7, rr.y - 38, 14, 20);
    c.font = "bold 10px Arial"; c.fillStyle = "#fff";
    if (cp.x > 0) { c.fillStyle = s.cardShow.color; c.beginPath(); c.arc(cp.x, cp.y, 17, 0, 7); c.lineWidth = 2.5; c.strokeStyle = s.cardShow.color; c.stroke(); }
  }
  // bola: bayangan di tanah, bola naik sesuai ketinggian
  c.fillStyle = `rgba(0,0,0,${Math.max(.1, .32 - bz / 260)})`; c.beginPath(); c.ellipse(b.x, b.y + 3, 6, 3, 0, 0, 7); c.fill();
  c.beginPath(); c.arc(b.x, b.y - bz * .7, 6 + bz / 28, 0, 7); c.fillStyle = "#fff"; c.fill(); c.lineWidth = 2; c.strokeStyle = "#111"; c.stroke();
  c.fillStyle = "#111"; c.beginPath(); c.arc(b.x, b.y - bz * .7, 2, 0, 7); c.fill();

  if (s.sp && s.sp.label) {                                  // keterangan bola mati
    c.font = "bold 13px Arial";
    const tw = c.measureText(s.sp.label).width;
    c.fillStyle = "rgba(0,0,0,.62)"; c.fillRect(W / 2 - tw / 2 - 14, 22, tw + 28, 26);
    c.fillStyle = "#ffd60a"; c.fillText(s.sp.label, W / 2, 35.5);
  }
  if (s.flash) {
    c.globalAlpha = Math.min(1, s.flash.t);
    c.font = "bold 32px Arial";
    const tw = Math.max(200, c.measureText(s.flash.text).width + 44);
    c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(W / 2 - tw / 2, H / 2 - 34, tw, 68);
    c.fillStyle = "#fff"; c.fillText(s.flash.text, W / 2, H / 2);
    c.globalAlpha = 1;
  }
}

const tac = (t, o) => ({ atk: o + (t === "attack" ? 4 : t === "defense" ? -3 : 0), def: o + (t === "defense" ? 4 : t === "attack" ? -3 : 0) });

function MatchCanvas({ home, away, slotsHome, slotsAway, playerNamesHome = [], playerNamesAway = [], playerNumbersHome = [], playerNumbersAway = [], goldenGoal, onFinish, publish, halftimeBreak, mySide = 0, renderHalftime, onRed }) {
  const cv = useRef(null), sim = useRef(null), spd = useRef(1), fin = useRef(onFinish), redCb = useRef(onRed);
  const [speed, setSpeed] = useState(1);
  const [ui, setUi] = useState({ a: 0, b: 0, m: 0, done: false, h: false, subAvailable: false, subReason: null, blockedSubNames: [], log: [], st: null });
  const [tacHt, setTacHt] = useState((mySide ? away : home).tactic);
  fin.current = onFinish; redCb.current = onRed;

  useEffect(() => {
    const s = (sim.current = initSim(
      slotsHome,
      slotsAway,
      [tac(home.tactic, home.ovr), tac(away.tactic, away.ovr)],
      !!goldenGoal,
      playerNamesHome,
      playerNamesAway,
      playerNumbersHome,
      playerNumbersAway
    ));
    s.hb = !!halftimeBreak;
    s.tn = [home.name, away.name];
    const ctx = cv.current.getContext("2d"), cols = [home.color, away.color];
    let last = performance.now(), raf, key = "", lastPub = 0, redSeen = 0;
    const loop = (now) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const sd = dt * spd.current, n = Math.ceil(sd / .03) || 1;
      for (let i = 0; i < n; i++) step(s, sd / n);
      draw(ctx, s, cols);
      while (redSeen < s.reds.length) {
        const rd = s.reds[redSeen++];
        if (rd.team === mySide && redCb.current) redCb.current(rd);
      }
      const k = `${s.score}|${Math.floor(s.min)}|${s.done}|${!!s.hold}|${s.holdReason || ""}|${s.deadReason || ""}|${!!s.subAvailable}|${s.subReason || ""}|${s.subbedOutNames?.length || 0}|${s.log.length}`;
      if (k !== key) {
        key = k;
        setUi({
          a: s.score[0], b: s.score[1], m: Math.min(90, Math.floor(s.min)), done: s.done, h: !!s.hold,
          subAvailable: !!s.subAvailable,
          subReason: s.subReason || null,
          blockedSubNames: [...(s.subbedOutNames || [])],
          holdReason: s.holdReason || null, deadReason: s.deadReason || null,
          log: s.log.slice(-7).reverse(), st: JSON.parse(JSON.stringify(s.stats))
        });
      }
      if (publish && now - lastPub > 80 && !s.pubDone) { lastPub = now; publish(snap(s)); if (s.done) s.pubDone = true; }
      if (s.done && !s.rep) {
        s.rep = true;
        const pen = goldenGoal && s.score[0] === s.score[1] ? (rnd() < home.ovr / (home.ovr + away.ovr) ? 0 : 1) : null;
        setTimeout(() => fin.current({ hg: s.score[0], ag: s.score[1], pen }), 900);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const s = sim.current;
    if (!s || !s.hold || publish || mySide) return;
    s.T[0] = tac(tacHt, home.ovr);
    const pendingByIndex = new Set((s.pendingSubs || []).map((item) => item.qIndex));
    if (slotsHome) mkPlayers(0, fromSlots(slotsHome), playerNamesHome, playerNumbersHome).forEach((n, i) => {
      const q = s.ps[i];
      if (q.off || q.gone) return;
      q.hx = q.x = n.hx; q.hy = q.y = n.hy; q.role = n.role;
      if (!pendingByIndex.has(i)) {
        q.name = n.name; q.num = n.num;
      }
    });
    // eslint-disable-next-line
  }, [home.ovr, slotsHome, playerNamesHome, playerNumbersHome]);

  // Pergantian yang dipilih saat permainan masih berjalan hanya DIANTRIKAN.
  // Pemain baru benar-benar masuk ketika bola mati / half time / jeda manual.
  const liveSubstitute = (slotId, card) => {
    const s = sim.current;
    const teamSlots = mySide === 0 ? slotsHome : slotsAway;
    const teamNumbers = mySide === 0 ? playerNumbersHome : playerNumbersAway;
    if (!s || !card || !teamSlots) return false;
    const canSubNow = !!s.subAvailable || (s.hold && (s.holdReason === "manual" || s.holdReason === "halftime"));
    if (!canSubNow) return false;
    const idx = teamSlots.findIndex((slot) => slot.id === slotId);
    if (idx < 0 || idx >= 11) return false;
    const qIndex = mySide * 11 + idx;
    const q = s.ps[qIndex];
    if (!q || q.off) return false;

    const slot = teamSlots[idx];
    const label = String(slot?.label || "").toUpperCase();
    const role = label === "GK" ? "gk" :
      ["CB", "LB", "RB", "LWB", "RWB", "SW", "DF"].includes(label) ? "def" :
      ["CM", "CDM", "CAM", "LM", "RM", "DM", "MF"].includes(label) ? "mid" : "fwd";

    const oldName = q.name || "";
    if (oldName && oldName !== card.name && !s.subbedOutNames.includes(oldName)) {
      s.subbedOutNames.push(oldName);
    }

    const item = { qIndex, slotId, card, num: teamNumbers[idx] || q.num || null, role, oldName };
    // PENTING: Jeda manual / halftime TIDAK membuat pemain langsung masuk.
    // Semua pilihan pergantian tetap antre dan baru dieksekusi pada momen sah.
    const old = s.pendingSubs.findIndex((x) => x.qIndex === qIndex);
    if (old >= 0) s.pendingSubs[old] = item;
    else s.pendingSubs.push(item);
    s.flash = { text: `🔄 ${card.name} SIAP MASUK`, t: 1.4 };
    note(s, `🔄 Pergantian ${oldName || "pemain"} → ${card.name} menunggu momen bola mati`);
    return true;
  };

  const resumeMatch = () => {
    const s = sim.current;
    if (!s || !s.hold) return;
    s.hold = false;
    s.holdReason = null;
    s.deadReason = null;
    s.flash = null;
  };

  const pauseMatch = () => {
    const s = sim.current;
    if (!s || s.done || s.hold) return;
    s.hold = true;
    s.holdReason = "manual";
    s.deadReason = null;
    s.flash = { text: "⏸ JEDA", t: 1e6 };
  };

  const resumeManualPause = () => {
    const s = sim.current;
    if (!s || !s.hold || s.holdReason !== "manual") return;
    s.hold = false;
    s.holdReason = null;
    s.deadReason = null;
    s.flash = null;
  };

  const skip = () => {
    const s = sim.current;
    if (!s || s.done) return;

    // Skip memang harus menyelesaikan pertandingan sampai FT.
    // Jadi semua jeda pergantian pemain/half-time dilewati sementara.
    const oldHold = s.hold;
    const oldReason = s.holdReason;
    const oldDeadReason = s.deadReason;
    const oldPause = s.pause;

    s.hold = false;
    s.holdReason = null;
    s.deadReason = null;
    s.pause = 0;

    let g = 0;
    while (!s.done && g++ < 20000) {
      // Kalau step membuat hold baru (mis. bola mati atau half time),
      // Skip langsung membuka lagi agar simulasi terus sampai selesai.
      step(s, .05);
      if (s.hold) {
        s.hold = false;
        s.holdReason = null;
        s.deadReason = null;
        s.pause = 0;
      }
    }

    if (!s.done) {
      s.hold = oldHold;
      s.holdReason = oldReason;
      s.deadReason = oldDeadReason;
      s.pause = oldPause;
    }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <b style={{ color: home.color === "#1e5bc6" ? "#7fb0ff" : home.color }}>{home.name} <small style={{ opacity: .6 }}>OVR {home.ovr}</small></b>
        <div style={{ fontSize: 32, fontWeight: 900 }}>{ui.a} - {ui.b}</div>
        <b style={{ textAlign: "right" }}>{away.name} <small style={{ opacity: .6 }}>OVR {away.ovr}</small></b>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ color: GOLD, fontWeight: 900, minWidth: 80 }}>{ui.done ? "FULL TIME" : `⏱ ${ui.m}'`}</span>
        {!publish && [1, 2, 4].map((v) => (
          <button key={v} style={btn(speed === v)} onClick={() => { spd.current = v; setSpeed(v); }}>{v}x</button>
        ))}
        {!publish && !ui.done && !ui.h && (
          <>
            <button style={btn(false)} onClick={pauseMatch}>⏸ Jeda</button>
            <button style={btn(false)} onClick={skip}>⏭ Skip</button>
          </>
        )}
      </div>
      <canvas ref={cv} width={W} height={H}
        style={{ width: "100%", display: "block", borderRadius: 16, border: "3px solid rgba(245,239,224,.25)" }} />
      {ui.st && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 10, fontSize: 12, opacity: .85 }}>
          <span>🎯 Tembakan {ui.st.shots[0]}-{ui.st.shots[1]}</span>
          <span>🚩 Pojok {ui.st.corners[0]}-{ui.st.corners[1]}</span>
          <span>🚨 Pelanggaran {ui.st.fouls[0]}-{ui.st.fouls[1]}</span>
          <span>🟨 {ui.st.yc[0]}-{ui.st.yc[1]}</span>
          <span>🟥 {ui.st.rc[0]}-{ui.st.rc[1]}</span>
        </div>
      )}
      {ui.log && ui.log.length > 0 && (
        <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 12, background: "rgba(0,0,0,.28)", border: "1px solid rgba(245,239,224,.12)", fontSize: 12, lineHeight: 1.7 }}>
          {ui.log.map((e, i) => (
            <div key={`${e.m}-${i}-${e.t}`} style={{ opacity: i === 0 ? 1 : Math.max(.4, 1 - i * .12) }}>
              <b style={{ color: GOLD, display: "inline-block", minWidth: 30 }}>{e.m}'</b> {e.t}
            </div>
          ))}
        </div>
      )}
      {ui.subAvailable && !publish && !ui.done && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: SOFT, border: `1px solid rgba(201,162,39,.65)`, textAlign: "center" }}>
          <div style={{ color: GOLD, fontWeight: 900, marginBottom: 5 }}>🔄 PERGANTIAN TERSEDIA</div>
          <div style={{ fontSize: 12, opacity: .75, marginBottom: 10 }}>{ui.subReason || "Bola mati"} · pertandingan tetap berjalan</div>
          {renderHalftime && renderHalftime({ liveSubstitute, blockedSubNames: ui.blockedSubNames || [] })}
        </div>
      )}
      {ui.h && !publish && ui.holdReason === "manual" && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: SOFT, border: "1px solid rgba(245,239,224,.25)", textAlign: "center" }}>
          <div style={{ color: GOLD, fontWeight: 900, marginBottom: 6 }}>⏸ MATCH DIJEDA</div>
          <div style={{ fontSize: 12, opacity: .7, marginBottom: 10 }}>Pertandingan benar-benar berhenti. Lu juga bisa melakukan pergantian pemain saat jeda manual.</div>
          {renderHalftime && renderHalftime({ liveSubstitute, blockedSubNames: ui.blockedSubNames || [] })}
          <button style={btn(true)} onClick={resumeManualPause}>▶ Lanjutkan Pertandingan</button>
        </div>
      )}
      {ui.h && !publish && ui.holdReason === "halftime" && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: SOFT, border: `1px solid ${GOLD}`, textAlign: "center" }}>
          <div style={{ color: GOLD, fontWeight: 900, marginBottom: 8 }}>⏸ HALF TIME — atur taktik & pergantian pemain</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <Tac v={tacHt} on={(x) => { setTacHt(x); sim.current.T[mySide] = tac(x, (mySide ? away : home).ovr); }} />
          </div>
          {renderHalftime && renderHalftime({ liveSubstitute, blockedSubNames: ui.blockedSubNames || [] })}
          <button style={btn(true)} onClick={resumeMatch}>▶ Mulai Babak Kedua</button>
        </div>
      )}
    </div>
  );
}

const Tac = ({ v, on }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    {[["attack", "⚔️ Serang"], ["balanced", "⚖️ Seimbang"], ["defense", "🛡️ Bertahan"]].map(([k, l]) => (
      <button key={k} onClick={() => on(k)} style={btn(v === k)}>{l}</button>
    ))}
  </div>
);

/* ================= MODE LIGA (vs AI) ================= */

const KEY = "ralouFootballLeague_v1";
const AI = ["Jakarta United", "Golden Lions", "Nusantara XI", "Royal Strikers", "Metro Stars", "Red Falcons", "Garuda City"];
const COL = ["#1e5bc6", "#b72e35", "#d4a017", "#7b3fb0", "#1f9d8a", "#e0662b", "#c43a8f", "#4a7c2f"];

function newLeague(ovr, teamName = "RGame FC") {
  const base = ovr || 70;
  return { round: 0, played: [], teams: [{ name: teamName || "RGame FC", ovr: base, color: COL[0] },
    ...AI.map((n, i) => ({ name: n, ovr: clamp(base + Math.round((rnd() - .5) * 22), 50, 97), color: COL[i + 1] }))] };
}

function makeFixtures(n) {
  const ids = [...Array(n).keys()], rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const m = [];
    for (let i = 0; i < n / 2; i++) { const a = ids[i], b = ids[n - 1 - i]; m.push(r % 2 ? [b, a] : [a, b]); }
    rounds.push(m); ids.splice(1, 0, ids.pop());
  }
  return [...rounds, ...rounds.map((rd) => rd.map(([a, b]) => [b, a]))];
}

const goals = (x, y) => { let n = 0; for (let i = 0; i < 9; i++) if (rnd() < clamp(.13 + (x - y) / 300, .03, .35)) n++; return n; };

function table(L) {
  const t = L.teams.map((x, i) => ({ i, name: x.name, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }));
  for (const m of L.played) {
    const h = t[m.h], a = t[m.a];
    h.P++; a.P++; h.GF += m.hg; h.GA += m.ag; a.GF += m.ag; a.GA += m.hg;
    if (m.hg > m.ag) { h.W++; a.L++; h.Pts += 3; }
    else if (m.hg < m.ag) { a.W++; h.L++; a.Pts += 3; }
    else { h.D++; a.D++; h.Pts++; a.Pts++; }
  }
  return t.sort((x, y) => y.Pts - x.Pts || (y.GF - y.GA) - (x.GF - x.GA) || y.GF - x.GF);
}

function LeaguePanel({ teamOverall, slots, ready, onReward, teamName = "RGame FC", formations = [], formation, onFormation, squad, collection = [], counts = {}, getCard, canPlay, onSub, suspended = {} }) {
  const [L, setL] = useState(() => {
    try { const r = JSON.parse(localStorage.getItem(KEY)); if (r?.teams) return r; } catch {}
    return newLeague(teamOverall, teamName);
  });
  const [live, setLive] = useState(null);
  const [msg, setMsg] = useState("");
  const [tacV, setTacV] = useState("balanced");
  useEffect(() => {
    if (L?.teams?.[0] && teamName && L.teams[0].name !== teamName) setL((cur) => ({ ...cur, teams: cur.teams.map((tm, i) => i === 0 ? { ...tm, name: teamName } : tm) }));
  }, [teamName]);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(L)); } catch {} }, [L]);
  const fx = useMemo(() => makeFixtures(8), []);
  const over = L.round >= fx.length;
  const round = fx[L.round] || [];
  const mine = round.find(([h, a]) => h === 0 || a === 0);
  const tb = table(L);
  const ovrOf = (i) => (i === 0 ? teamOverall || L.teams[0].ovr : L.teams[i].ovr);

  // Nama pemain tim user diambil dari My Squad, sama seperti Tab Match.
  const playerNames = useMemo(() => (
    (slots || []).map((s) => {
      const card = s?.id && squad?.[s.id] && getCard ? getCard(squad[s.id]) : null;
      return card?.name || s?.name || s?.playerName || "";
    })
  ), [slots, squad, getCard]);

  function apply(hg, ag) {
    const res = round.map(([h, a]) => (h === 0 || a === 0 ? { h, a, hg, ag }
      : { h, a, hg: goals(ovrOf(h), ovrOf(a)), ag: goals(ovrOf(a), ovrOf(h)) }));
    const next = { ...L, round: L.round + 1, played: [...L.played, ...res] };
    const my = mine[0] === 0 ? [hg, ag] : [ag, hg];
    let reward = my[0] > my[1] ? 100 : my[0] === my[1] ? 50 : 25, text = my[0] > my[1] ? "MENANG" : my[0] === my[1] ? "SERI" : "KALAH";
    if (next.round >= fx.length && table(next)[0].i === 0) { reward += 500; text += " · 🏆 JUARA LIGA! +500 bonus"; }
    setL(next); onReward?.(reward);
    setMsg(`${text} ${my[0]}-${my[1]} · +${reward} 🪙`);
  }

  function start() {
    if (!ready) return setMsg("Isi 11 pemain di My Squad dulu.");
    const [h, a] = mine, t = L.teams;
    const mk = (i) => ({ name: t[i].name, color: t[i].color, ovr: ovrOf(i), tactic: i === 0 ? tacV : "balanced" });
    setLive({ h, a, home: mk(h), away: mk(a) });
  }

  function simRound() {
    if (!ready) return setMsg("Isi 11 pemain di My Squad dulu.");
    const [h, a] = mine; apply(goals(ovrOf(h), ovrOf(a)), goals(ovrOf(a), ovrOf(h)));
  }

  if (live) {
    return (
      <div style={box}>
        <MatchCanvas key={L.round} home={live.home} away={live.away} halftimeBreak mySide={live.h === 0 ? 0 : 1}
          slotsHome={live.h === 0 ? slots : null} slotsAway={live.a === 0 ? slots : null}
          playerNamesHome={live.h === 0 ? playerNames : []}
          playerNamesAway={live.a === 0 ? playerNames : []}
          onFinish={({ hg, ag }) => { apply(hg, ag); setLive(null); }}
          renderHalftime={({ liveSubstitute, blockedSubNames }) => (
            <HalftimeTools
              slots={slots}
              formations={formations}
              formation={formation}
              onFormation={onFormation}
              squad={squad}
              collection={collection}
              counts={counts}
              getCard={getCard}
              canPlay={canPlay}
              onSub={(slotId, cardId) => {
                const card = getCard?.(cardId);
                return liveSubstitute?.(slotId, card) || false;
              }}
              liveSubstitute={liveSubstitute}
              blockedSubNames={blockedSubNames}
              suspended={suspended}
            />
          )}
        />
      </div>
    );
  }

  const th = { padding: "6px 8px", textAlign: "center", opacity: .7, fontSize: 12 };
  return (
    <div>
      <div style={{ ...box, marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>LIGA vs AI</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{over ? "Musim selesai" : `Pekan ${L.round + 1} / ${fx.length}`}</div>
        </div>
        {!over && <Tac v={tacV} on={setTacV} />}
        <div style={{ display: "flex", gap: 8 }}>
          {!over && <button style={btn(true)} onClick={start}>▶ Main (Auto-play)</button>}
          {!over && <button style={btn(false)} onClick={simRound}>⏭ Sim Pekan</button>}
          {over && <button style={btn(true)} onClick={() => { setL(newLeague(teamOverall, teamName)); setMsg(""); }}>🔄 Musim Baru</button>}
        </div>
      </div>
      {msg && <div style={{ ...box, marginBottom: 16, fontWeight: 800 }}>{msg}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <div style={box}>
          <h3 style={{ marginTop: 0, color: GOLD }}>🏆 Klasemen</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr><th style={th}>#</th><th style={{ ...th, textAlign: "left" }}>Tim</th>
              {["P", "W", "D", "L", "GD", "Pts"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{tb.map((r, k) => (
              <tr key={r.i} style={{ background: r.i === 0 ? "rgba(201,162,39,.16)" : k % 2 ? SOFT : "transparent", fontWeight: r.i === 0 ? 900 : 500 }}>
                <td style={{ ...th, opacity: 1, color: k === 0 ? GOLD : CREAM }}>{k + 1}</td>
                <td style={{ padding: "6px 8px" }}><span style={{ color: L.teams[r.i].color }}>●</span> {r.name}</td>
                {[r.P, r.W, r.D, r.L, r.GF - r.GA, r.Pts].map((v, j) => (
                  <td key={j} style={{ ...th, opacity: 1, color: j === 5 ? GOLD : CREAM }}>{v}</td>))}
              </tr>))}</tbody>
          </table>
        </div>
        <div style={box}>
          <h3 style={{ marginTop: 0, color: GOLD }}>📅 Jadwal Pekan {Math.min(L.round + 1, fx.length)}</h3>
          {over ? <div style={{ opacity: .7 }}>Juara: <b>{L.teams[tb[0].i].name}</b></div> : round.map(([h, a], k) => (
            <div key={k} style={{ padding: 10, borderRadius: 10, marginBottom: 8, background: h === 0 || a === 0 ? "rgba(201,162,39,.16)" : SOFT, display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
              <span>{L.teams[h].name}</span><span style={{ opacity: .5 }}>vs</span><span>{L.teams[a].name}</span>
            </div>))}
        </div>
      </div>
    </div>
  );
}

/* ================= PvP KICK-OFF (2 mode) ================= */

function LocalPvP({ myOvr, slots, playerNames = [] }) {
  const [mode, setMode] = useState("friendly");
  const [p1, setP1] = useState({ name: "Pemain 1", ovr: myOvr || 75, tactic: "balanced", color: "#1e5bc6" });
  const [p2, setP2] = useState({ name: "Pemain 2", ovr: 75, tactic: "balanced", color: "#b72e35" });
  const [live, setLive] = useState(0);
  const [res, setRes] = useState(null);

  const card = (p, set) => (
    <div style={box}>
      <input value={p.name} onChange={(e) => set({ ...p, name: e.target.value })}
        style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 10, background: SOFT, color: CREAM, border: `1px solid ${p.color}`, fontWeight: 900, marginBottom: 12 }} />
      <div style={{ marginBottom: 6, fontWeight: 800 }}>OVR: <span style={{ color: GOLD }}>{p.ovr}</span></div>
      <input type="range" min={55} max={99} value={p.ovr} onChange={(e) => set({ ...p, ovr: +e.target.value })} style={{ width: "100%", marginBottom: 12 }} />
      <Tac v={p.tactic} on={(t) => set({ ...p, tactic: t })} />
    </div>
  );

  let verdict = "";
  if (res) {
    verdict = res.hg > res.ag ? `${p1.name} menang!` : res.hg < res.ag ? `${p2.name} menang!`
      : res.pen != null ? `Seri — adu penalti dimenangkan ${res.pen ? p2.name : p1.name}` : "Pertandingan seri";
  }

  if (live) {
    return (
      <div style={box}>
        <MatchCanvas key={live} home={p1} away={p2} slotsHome={slots} playerNamesHome={playerNames} goldenGoal={mode === "golden"} onFinish={setRes} />
        {res && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: GOLD }}>🏆 {verdict}</div>
            <button style={{ ...btn(true), marginTop: 12 }} onClick={() => { setLive(0); setRes(null); }}>🔄 Main Lagi</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>PvP KICK-OFF</div>
        <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
          <button style={btn(mode === "friendly")} onClick={() => setMode("friendly")}>⚽ Friendly 90 Menit</button>
          <button style={btn(mode === "golden")} onClick={() => setMode("golden")}>🥇 Golden Goal (gol pertama menang)</button>
        </div>
        <button style={btn(true)} onClick={() => { setRes(null); setLive((n) => n + 1); }}>▶ Kick-off!</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {card(p1, setP1)}{card(p2, setP2)}
      </div>
    </div>
  );
}

/* ================= PvP ONLINE (Firebase, host-authoritative) ================= */

const snap = (s) => ({
  p: s.ps.flatMap((p) => [Math.round(p.x), Math.round(p.y)]),
  n: s.ps.map((p) => p.name || ""),
  b: [Math.round(s.ball.x), Math.round(s.ball.y)], z: Math.round(s.ball.z || 0), cp: s.sp && s.sp.label ? s.sp.label : 0,
  o: s.owner ?? -1, sc: s.score, m: Math.round(s.min * 10) / 10, f: s.flash ? s.flash.text : 0, d: s.done ? 1 : 0,
});

const uid = (() => {
  try {
    let v = sessionStorage.getItem("ralouRoomUid");
    if (!v) { v = "u_" + Date.now() + rnd().toString(36).slice(2, 8); sessionStorage.setItem("ralouRoomUid", v); }
    return v;
  } catch { return "u_" + rnd().toString(36).slice(2, 10); }
})();

const roomRef = (c) => dbRef(db, `rooms/footballRooms/${c}`);
const genCode = () => Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(rnd() * 32)]).join("");

function GuestView({ code, home, away }) {
  const cv = useRef(null), buf = useRef([]);
  const [ui, setUi] = useState({ a: 0, b: 0, m: 0, done: false });

  useEffect(() => {
    const un = onValue(dbRef(db, `rooms/footballRooms/${code}/snap`), (sn) => {
      const v = sn.val(); if (!v || !v.p) return;
      buf.current.push({ at: performance.now(), v }); if (buf.current.length > 14) buf.current.shift();
    });

    const ctx = cv.current.getContext("2d"), cols = [home.color, away.color];
    let raf, key = "", trail = [];
    const loop = (now) => {
      const B = buf.current;
      if (B.length) {
        const rt = now - 170, last = B[B.length - 1];
        let a = B[0], c = B[0];
        if (rt >= last.at) a = c = last;
        else if (rt > B[0].at) for (let k = 0; k < B.length - 1; k++) if (B[k].at <= rt && B[k + 1].at >= rt) { a = B[k]; c = B[k + 1]; }
        const f = a === c ? 0 : clamp((rt - a.at) / (c.at - a.at), 0, 1), L = (x, y) => x + (y - x) * f;
        const ps = Array.from({ length: 22 }, (_, n) => ({
          team: n < 11 ? 0 : 1, i: n,
          name: (c.v.n && c.v.n[n]) || (a.v.n && a.v.n[n]) || "",
          x: L(a.v.p[2 * n], c.v.p[2 * n]), y: L(a.v.p[2 * n + 1], c.v.p[2 * n + 1])
        }));
        const ball = { x: L(a.v.b[0], c.v.b[0]), y: L(a.v.b[1], c.v.b[1]), z: c.v.z || 0 };
        trail.push({ x: ball.x, y: ball.y }); if (trail.length > 9) trail.shift();
        draw(ctx, { ps, ball, owner: c.v.o, trail, sp: c.v.cp ? { label: c.v.cp } : null, flash: c.v.f ? { text: c.v.f, t: 1 } : null }, cols);
        const k = `${last.v.sc}|${Math.floor(last.v.m)}|${last.v.d}`;
        if (k !== key) { key = k; setUi({ a: last.v.sc[0], b: last.v.sc[1], m: Math.min(90, Math.floor(last.v.m)), done: !!last.v.d }); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); un(); };
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <b style={{ color: "#7fb0ff" }}>{home.name} <small style={{ opacity: .6 }}>OVR {home.ovr}</small></b>
        <div style={{ fontSize: 32, fontWeight: 900 }}>{ui.a} - {ui.b}</div>
        <b style={{ textAlign: "right" }}>{away.name} <small style={{ opacity: .6 }}>OVR {away.ovr}</small></b>
      </div>
      <div style={{ color: GOLD, fontWeight: 900, marginBottom: 10 }}>{ui.done ? "FULL TIME" : `⏱ ${ui.m}'`} · 🌐 LIVE</div>
      <canvas ref={cv} width={W} height={H}
        style={{ width: "100%", display: "block", borderRadius: 16, border: "3px solid rgba(245,239,224,.25)" }} />
    </div>
  );
}

function OnlinePvP({ myOvr, slots, playerNames = [], teamName = "RGame FC" }) {
  const [name, setName] = useState("Pemain");
  const [tacV, setTacV] = useState("balanced");
  const [code, setCode] = useState(""), [input, setInput] = useState("");
  const [room, setRoom] = useState(null), [err, setErr] = useState("");
  const leaving = useRef(false);
  const ovr = myOvr || 70;
  const role = room ? (room.host?.uid === uid ? "host" : "guest") : null;

  useEffect(() => {
    if (!code) return undefined;
    let seen = false;
    const un = onValue(roomRef(code), (sn) => {
      const v = sn.val();
      if (v) { seen = true; setRoom(v); }
      else if (seen && !leaving.current) { setRoom(null); setCode(""); setErr("Room ditutup oleh host."); }
    }, () => setErr("Gagal terhubung ke Firebase. Cek Rules untuk footballRooms."));
    return un;
  }, [code]);

  async function create(mode) {
    const c = genCode();
    try {
      await dbSet(roomRef(c), {
        mode, status: "waiting", round: 0,
        host: { uid, name, teamName, ovr, tactic: tacV, slots: (slots || []).map((s) => [s.x, s.y]), playerNames }
      });
      await onDisconnect(roomRef(c)).remove();
      leaving.current = false; setErr(""); setCode(c);
    } catch (e) {
      console.error("Football PvP create room error:", e);
      setErr(e?.code === "PERMISSION_DENIED" ? "Firebase menolak akses room. Pastikan path rooms/footballRooms diizinkan Rules." : `Gagal membuat room: ${e?.message || "koneksi Firebase bermasalah"}`);
    }
  }

  async function join() {
    const c = input.trim().toUpperCase();
    try {
      const v = (await get(roomRef(c))).val();
      if (!v) return setErr("Room tidak ditemukan.");
      if (v.guest || v.status !== "waiting") return setErr("Room sudah penuh atau sedang berjalan.");
      await dbUpdate(roomRef(c), {
        guest: {
          uid, name, teamName, ovr, tactic: tacV,
          slots: (slots || []).map((s) => [s.x, s.y]),
          playerNames
        }
      });
      onDisconnect(dbRef(db, `rooms/footballRooms/${c}/guest`)).remove();
      leaving.current = false; setErr(""); setCode(c);
    } catch (e) {
      console.error("Football PvP join error:", e);
      setErr(e?.code === "PERMISSION_DENIED" ? "Firebase menolak akses room. Pastikan path rooms/footballRooms diizinkan Rules." : `Gagal bergabung: ${e?.message || "koneksi Firebase bermasalah"}`);
    }
    return undefined;
  }

  async function leave() {
    leaving.current = true;
    const c = code;
    try { if (role === "host") await dbRemove(roomRef(c)); else await dbRemove(dbRef(db, `rooms/footballRooms/${c}/guest`)); } catch {}
    setCode(""); setRoom(null);
  }

  const setTac = (t) => { setTacV(t); if (code && role) dbUpdate(dbRef(db, `footballRooms/${code}/${role}`), { tactic: t }).catch(() => {}); };
  const publish = (sn) => dbSet(dbRef(db, `rooms/footballRooms/${code}/snap`), sn).catch(() => {});

  if (!room) {
    return (
      <div style={box}>
        <div style={{ color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>PvP ONLINE</div>
        <div style={{ display: "flex", gap: 10, margin: "12px 0", flexWrap: "wrap", alignItems: "center" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama"
            style={{ padding: 10, borderRadius: 10, background: SOFT, color: CREAM, border: `1px solid ${GOLD}`, fontWeight: 900 }} />
          <span style={{ fontWeight: 800 }}>OVR squad: <span style={{ color: GOLD }}>{ovr}</span></span>
        </div>
        <Tac v={tacV} on={setTacV} />
        <div style={{ display: "flex", gap: 8, margin: "16px 0", flexWrap: "wrap" }}>
          <button style={btn(true)} onClick={() => create("friendly")}>➕ Buat Room · Friendly 90'</button>
          <button style={btn(true)} onClick={() => create("golden")}>➕ Buat Room · Golden Goal</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} placeholder="KODE ROOM" maxLength={4}
            style={{ width: 120, padding: 10, borderRadius: 10, background: SOFT, color: CREAM, border: "1px solid rgba(245,239,224,.3)", fontWeight: 900, letterSpacing: 4, textAlign: "center" }} />
          <button style={btn(false)} onClick={join}>🚪 Gabung</button>
        </div>
        {err && <div style={{ marginTop: 12, color: "#ff8f8f", fontWeight: 800 }}>{err}</div>}
      </div>
    );
  }

  const g = room.guest;
  if (room.status !== "waiting") {
    if (!g) return <div style={box}>Lawan keluar dari room. <button style={btn(true)} onClick={leave}>Keluar</button></div>;
    const R = room.result;
    const verdict = R && (R.hg > R.ag ? `${room.host.name} menang!` : R.hg < R.ag ? `${g.name} menang!`
      : R.pen >= 0 ? `Seri — penalti untuk ${R.pen ? g.name : room.host.name}` : "Pertandingan seri");
    const home = { ...room.host, name: room.host.teamName || room.host.name, color: "#1e5bc6" }, away = { ...g, name: g.teamName || g.name, color: "#b72e35" };

    return (
      <div style={box}>
        {role === "host"
          ? <MatchCanvas
              key={room.round || 0}
              home={home}
              away={away}
              slotsHome={slots}
              slotsAway={g.slots ? g.slots.map(([x, y]) => ({ x, y })) : null}
              playerNamesHome={room.host.playerNames || []}
              playerNamesAway={g.playerNames || []}
              goldenGoal={room.mode === "golden"}
              publish={publish}
              onFinish={(r) => dbUpdate(roomRef(code), { status: "finished", result: { hg: r.hg, ag: r.ag, pen: r.pen ?? -1 } }).catch(() => {})}
            />
          : <GuestView key={room.round || 0} code={code} home={home} away={away} />}
        {room.status === "finished" && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: GOLD }}>🏆 {verdict}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
              {role === "host" && <button style={btn(true)} onClick={() => dbUpdate(roomRef(code), { status: "waiting", result: null, snap: null, round: (room.round || 0) + 1 })}>🔄 Main Lagi</button>}
              <button style={btn(false)} onClick={leave}>Keluar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={{ color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>LOBBY · {room.mode === "golden" ? "GOLDEN GOAL" : "FRIENDLY 90'"}</div>
      <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 8, margin: "8px 0" }}>{code}</div>
      <div style={{ opacity: .7, marginBottom: 14 }}>Bagikan kode ini ke temanmu.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
        {[["🔵 Host", room.host], ["🔴 Guest", g]].map(([l, p]) => (
          <div key={l} style={{ background: SOFT, borderRadius: 12, padding: 12 }}>
            <div style={{ opacity: .6, fontSize: 12 }}>{l}</div>
            {p ? <><b>{p.name}</b> · OVR {p.ovr}<div style={{ fontSize: 12, opacity: .7 }}>Taktik: {p.tactic}</div></> : <i style={{ opacity: .6 }}>Menunggu lawan…</i>}
          </div>))}
      </div>
      <Tac v={(role === "host" ? room.host : g)?.tactic || tacV} on={setTac} />
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {role === "host" && <button disabled={!g} style={{ ...btn(true), opacity: g ? 1 : .45 }} onClick={() => dbUpdate(roomRef(code), { status: "playing" })}>▶ Kick-off!</button>}
        {role === "guest" && <span style={{ alignSelf: "center", opacity: .7 }}>Menunggu host memulai…</span>}
        <button style={btn(false)} onClick={leave}>Keluar</button>
      </div>
    </div>
  );
}

function PvPPanel(props) {
  const [t, setT] = useState("online");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={btn(t === "online")} onClick={() => setT("online")}>🌐 Online</button>
        <button style={btn(t === "local")} onClick={() => setT("local")}>👥 Lokal</button>
      </div>
      {t === "online" ? <OnlinePvP {...props} /> : <LocalPvP {...props} />}
    </div>
  );
}

/* ================= TAB MATCH BARU ================= */

function QuickMatchPanel({ teamOverall, slots, ready, onRecord, formations = [], formation, onFormation, squad = {}, collection = [], counts = {}, getCard, canPlay, onSub, teamName = "RGame FC", suspended = {}, slotNumbers = {} }) {
  const [opp, setOpp] = useState(null), [n, setN] = useState(0), [tacV, setTacV] = useState("balanced"), [res, setRes] = useState(null);
  const [redIdx, setRedIdx] = useState([]), [redIds, setRedIds] = useState([]);
  const sqRef = useRef(squad), redsRef = useRef([]);
  sqRef.current = squad;

  const playerNames = useMemo(() => (
    (slots || []).map((s) => {
      const card = s?.id && squad?.[s.id] && getCard ? getCard(squad[s.id]) : null;
      return card?.name || s?.name || s?.playerName || "";
    })
  ), [slots, squad, getCard]);

  const playerNumbers = useMemo(() => (
    (slots || []).map((s) => (s?.id && squad?.[s.id] ? slotNumbers?.[s.id] || null : null))
  ), [slots, squad, slotNumbers]);

  const blocked = (slots || []).filter((sl) => squad?.[sl.id] && suspended?.[squad[sl.id]]);
  const suspNames = Object.keys(suspended || {}).map((id) => getCard?.(id)?.name).filter(Boolean);
  const canStart = ready && blocked.length === 0;

  const start = () => {
    if (!canStart) { setOpp(null); setRes(null); return; }
    redsRef.current = []; setRedIdx([]); setRedIds([]);
    setOpp({ name: AI[Math.floor(rnd() * AI.length)], ovr: clamp(teamOverall + Math.floor(rnd() * 19) - 9, 55, 98), tactic: "balanced", color: "#b72e35" });
    setRes(null); setN((k) => k + 1);
  };

  // pemain kita kena kartu merah: catat id kartunya saat itu juga
  const handleRed = (rd) => {
    const slot = slots?.[rd.idx];
    const id = slot ? sqRef.current?.[slot.id] : null;
    if (id) { redsRef.current.push({ id, name: rd.name }); setRedIds((p) => [...p, id]); }
    setRedIdx((p) => [...p, rd.idx]);
  };

  function finish({ hg, ag }) {
    const r = hg > ag ? "WIN" : hg < ag ? "LOSS" : "DRAW", reward = r === "WIN" ? 80 : r === "DRAW" ? 45 : 25;
    const reds = redsRef.current;
    const redNames = reds.map((x) => getCard?.(x.id)?.name || x.name || "Pemain");
    setRes({ r, reward, redNames });
    onRecord({ opponent: opp.name, opponentOverall: opp.ovr, userOverall: teamOverall, userGoals: hg, oppGoals: ag, result: r, reward, reds: reds.map((x) => x.id), redNames });
  }

  if (!opp) {
    return (
      <div style={{ ...box, textAlign: "center" }}>
        <div style={{ color: GOLD, fontSize: 13, fontWeight: 900, letterSpacing: 3 }}>AUTO MATCH</div>
        <h2>Pertandingan Cepat</h2>
        <p style={{ opacity: .7 }}>{ready ? "Pilih taktik lalu mulai. Pertandingan berjalan otomatis." : "Isi 11 pemain (termasuk GK) di My Squad dulu."}</p>
        {suspNames.length > 0 && (
          <div style={{ margin: "0 auto 14px", maxWidth: 520, padding: "10px 14px", borderRadius: 12, background: "rgba(224,38,43,.14)", border: "1px solid rgba(224,38,43,.5)", fontSize: 13, lineHeight: 1.6 }}>
            🟥 <b>Skorsing kartu merah</b> — tidak bisa dimainkan di match ini:<br />
            <b>{suspNames.join(", ")}</b>
          </div>
        )}
        {blocked.length > 0 && (
          <div style={{ textAlign: "left", marginBottom: 14 }}>
            <div style={{ color: "#ff8a8a", fontWeight: 900, fontSize: 13, textAlign: "center", marginBottom: 8 }}>
              Ganti dulu pemain yang diskors: {blocked.map((sl) => `${getCard?.(squad[sl.id])?.name || "?"} (${sl.label})`).join(", ")}
            </div>
            <HalftimeTools {...{ slots, formations, formation, onFormation, squad, collection, counts, getCard, canPlay, onSub, suspended }} />
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Tac v={tacV} on={setTacV} /></div>
        <button disabled={!canStart} style={{ ...btn(true), opacity: canStart ? 1 : .45 }} onClick={start}>🏟️ Mulai Match</button>
      </div>
    );
  }

  return (
    <div style={box}>
      <MatchCanvas
        key={n}
        home={{ name: teamName || "RGame FC", ovr: teamOverall, tactic: tacV, color: "#1e5bc6" }}
        away={opp}
        slotsHome={slots}
        playerNamesHome={playerNames}
        playerNumbersHome={playerNumbers}
        halftimeBreak
        onRed={handleRed}
        onFinish={finish}
        renderHalftime={({ liveSubstitute, blockedSubNames }) => (
          <HalftimeTools
            {...{ slots, formations, formation, onFormation, squad, collection, counts, getCard, canPlay, suspended, offIdx: redIdx, redIds }}
            blockedSubNames={blockedSubNames}
            onSub={(slotId, cardId) => {
              const ok = onSub?.(slotId, cardId);
              if (ok) liveSubstitute?.(slotId, getCard?.(cardId));
              return ok;
            }}
          />
        )}
      />
      {res && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: res.r === "WIN" ? "#69d27c" : res.r === "LOSS" ? "#ff7777" : GOLD }}>
            {res.r === "WIN" ? "🏆 MENANG" : res.r === "LOSS" ? "💥 KALAH" : "🤝 SERI"} · +{res.reward} 🪙
          </div>
          {res.redNames?.length > 0 && (
            <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(224,38,43,.14)", border: "1px solid rgba(224,38,43,.5)", fontSize: 13, display: "inline-block" }}>
              🟥 {res.redNames.join(", ")} kena kartu merah — <b>tidak bisa dimainkan di match berikutnya</b>.
            </div>
          )}
          <div><button style={{ ...btn(true), marginTop: 12 }} onClick={start}>🔄 Main Lagi</button></div>
        </div>
      )}
    </div>
  );
}

function HalftimeTools({ slots, formations, formation, onFormation, squad, collection, counts, getCard, canPlay, onSub, liveSubstitute, blockedSubNames = [], suspended = {}, offIdx = [], redIds = [] }) {
  const [sel, setSel] = useState(null);
  if (!getCard || !slots) return null;
  const slot = slots.find((s) => s.id === sel);
  const cands = slot ? [...new Set(collection)].map(getCard).filter((c) => c && canPlay(c, slot.label) &&
    !suspended[c.id] && !redIds.includes(c.id) &&
    !blockedSubNames.includes(c.name) &&
    !findSameNameInSquad(squad, c, sel) &&
    Object.entries(squad).filter(([id, cid]) => id !== sel && cid === c.id).length < (counts[c.id] || 0)) : [];
  const lockForm = offIdx.length > 0;

  return (
    <div style={{ textAlign: "left", marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
        {formations.map((f) => <button key={f} disabled={lockForm} style={{ ...btn(f === formation), opacity: lockForm ? .45 : 1 }} onClick={() => { onFormation(f); setSel(null); }}>{f}</button>)}
      </div>
      {lockForm && <div style={{ fontSize: 11, opacity: .7, textAlign: "center", marginBottom: 8 }}>Formasi dikunci karena tim bermain dengan 10 orang.</div>}
      <div style={{ color: GOLD, fontSize: 11, fontWeight: 900, marginBottom: 6 }}>PILIH POSISI YANG MAU DIGANTI</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
        {slots.map((s, idx) => {
          const c = squad[s.id] ? getCard(squad[s.id]) : null;
          const isOff = offIdx.includes(idx);
          const isSusp = !!(squad[s.id] && suspended[squad[s.id]]);
          return (
            <button key={s.id} disabled={isOff} style={{ ...btn(sel === s.id), textAlign: "left", ...(isOff || isSusp ? { borderColor: "#e0262b", opacity: isOff ? .55 : 1 } : {}) }} onClick={() => setSel(s.id)}>
              <div style={{ fontSize: 10, color: GOLD }}>{s.label}{isOff ? " 🟥" : isSusp ? " ⛔" : ""}</div>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c?.name || "Kosong"}</div>
              {c && <small style={{ opacity: .65 }}>{isOff ? "Kartu merah" : isSusp ? "Diskors" : `OVR ${c.overall}`}</small>}
            </button>
          );
        })}
      </div>
      {slot && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {cands.length ? cands.map((c) => (
            <button key={c.id} style={btn(false)} onClick={() => {
              const ok = onSub?.(sel, c.id);
              setSel(null);
            }}>{c.name} · {c.position} · {c.overall}</button>
          )) : <i style={{ opacity: .65 }}>Tidak ada pengganti yang cocok.</i>}
        </div>
      )}
    </div>
  );
}