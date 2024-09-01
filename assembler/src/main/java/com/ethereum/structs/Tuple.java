package com.ethereum.structs;

import com.ethereum.exceptions.NotImplemented;
import com.ethereum.utils.Utils;

import java.util.Map;

public class Tuple<T,V> implements Map.Entry<T,V> {
    private final T key;
    private final V value;

    @Override
    public T getKey() {
        return this.key;
    }

    @Override
    public V getValue() {
        return this.value;
    }

    @Override
    public V setValue(V value) {
        throw new NotImplemented("Not implemented. Tuple is static.");
    }

    @Override
    public boolean equals(Object o) {
        if(o==null) return false;
        if(o==this) return true;
        if(o instanceof Tuple<?,?> anotherTuple) return Utils.equalsWithNullCase(this.key,anotherTuple.key) && Utils.equalsWithNullCase(this.value,anotherTuple.value);
        return false;
    }

    @Override
    public int hashCode() {
        return (this.key==null ? 2 : this.key.hashCode()) + (this.value==null ? 3 : this.value.hashCode());
    }

    public Tuple(T key, V value){
        this.key = key;
        this.value = value;
    }
}
