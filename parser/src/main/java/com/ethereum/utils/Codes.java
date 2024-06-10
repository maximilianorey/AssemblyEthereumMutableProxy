package com.ethereum.utils;

import com.ethereum.structs.Tuple;

import java.util.Map;
import java.util.Set;

public class Codes {
    public static final Set<String> reservedLabels = Set.of("CONSTRUCTOR LENGTH", "CODE LENGTH", "TOTAL LENGTH");
    public static final Map<String, Integer> pushCodes = Map.ofEntries(
            new Tuple<>("60", 1),
            new Tuple<>("61", 2),
            new Tuple<>("62", 3),
            new Tuple<>("63", 4),
            new Tuple<>("64", 5),
            new Tuple<>("65", 6),
            new Tuple<>("66", 7),
            new Tuple<>("67", 8),
            new Tuple<>("68", 9),
            new Tuple<>("69", 10),
            new Tuple<>("6A", 11),
            new Tuple<>("6B", 12),
            new Tuple<>("6C", 13),
            new Tuple<>("6D", 14),
            new Tuple<>("6E", 15),
            new Tuple<>("6F", 16),
            new Tuple<>("70", 17),
            new Tuple<>("71", 18),
            new Tuple<>("72", 19),
            new Tuple<>("73", 20),
            new Tuple<>("74", 21),
            new Tuple<>("75", 22),
            new Tuple<>("76", 23),
            new Tuple<>("77", 24),
            new Tuple<>("78", 25),
            new Tuple<>("79", 26),
            new Tuple<>("7A", 27),
            new Tuple<>("7B", 28),
            new Tuple<>("7C", 29),
            new Tuple<>("7D", 30),
            new Tuple<>("7E", 31),
            new Tuple<>("7F", 32)
    );
}
