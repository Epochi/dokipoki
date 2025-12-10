# Compatibility patch for Ruby 3.2+ where `tainted?` was removed.
# Liquid (used by Jekyll) vis dar kviečia `tainted?`, todėl čia grąžinam jį atgal.

unless Object.method_defined?(:tainted?)
  class Object
    def tainted?
      false
    end
  end
end
